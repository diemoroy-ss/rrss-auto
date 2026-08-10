export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';
import { encrypt } from '../../../../../lib/encryption';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const stateStr = searchParams.get('state');
    const errorParam = searchParams.get('error');

    const host = req.headers.get('host') || 'localhost:3003';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const configPageUrl = `${protocol}://${host}/automatizacion-rrss/panel/configuracion`;

    if (errorParam || !code || !stateStr) {
      console.warn('OAuth X cancelado o fallido:', errorParam);
      return NextResponse.redirect(`${configPageUrl}?x_error=cancelled`);
    }

    let stateObj: { profileId: string; userId: string; codeVerifier: string };
    try {
      stateObj = JSON.parse(Buffer.from(stateStr, 'base64').toString('utf-8'));
    } catch {
      return NextResponse.redirect(`${configPageUrl}?x_error=invalid_state`);
    }

    const clientId = process.env.X_CLIENT_ID || process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET || process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = `${protocol}://${host}/api/social-auth/x/callback`;

    if (!clientId) {
      return NextResponse.redirect(`${configPageUrl}?x_error=missing_credentials`);
    }

    // Preparar headers de autenticación si se cuenta con Client Secret
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (clientSecret) {
      const authHeaderStr = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${authHeaderStr}`;
    }

    const bodyParams = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: stateObj.codeVerifier,
    });

    // 1. Intercambiar código por Access Token en X API v2
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers,
      body: bodyParams,
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Error al obtener tokens de X:', tokenData);
      return NextResponse.redirect(`${configPageUrl}?x_error=token_failed`);
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || '';

    // 2. Obtener datos del perfil de X (@username y nombre)
    let username = 'Usuario X';
    let name = '';
    let xUserId = '';

    try {
      const userRes = await fetch('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userData = await userRes.json();
      if (userData.data) {
        username = userData.data.username ? `@${userData.data.username}` : username;
        name = userData.data.name || '';
        xUserId = userData.data.id || '';
      }
    } catch (uErr) {
      console.warn('No se pudo consultar el usuario de X:', uErr);
    }

    // 3. Guardar credenciales encriptadas en Firestore dentro del perfil del usuario
    if (adminDb && stateObj.userId && stateObj.profileId) {
      const userRef = adminDb.collection('users').doc(stateObj.userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data() || {};
        let profiles = userData.profiles || [];

        const targetIdx = profiles.findIndex((p: any) => p.id === stateObj.profileId);
        if (targetIdx !== -1) {
          const encAccessToken = encrypt(accessToken);
          const encRefreshToken = refreshToken ? encrypt(refreshToken) : '';

          profiles[targetIdx] = {
            ...profiles[targetIdx],
            xConnected: true,
            xUsername: username,
            accounts: {
              ...(profiles[targetIdx].accounts || {}),
              x: {
                connected: true,
                username,
                name,
                xUserId,
                token: encAccessToken,
                refreshToken: encRefreshToken,
                updatedAt: new Date().toISOString(),
              },
            },
          };

          await userRef.update({ profiles });
        }
      }
    }

    return NextResponse.redirect(`${configPageUrl}?x=success`);
  } catch (error: any) {
    console.error('Error inesperado en callback de X:', error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rrss.santisoft.cl';
    return NextResponse.redirect(`${appUrl}/automatizacion-rrss/panel/configuracion?x_error=server_error`);
  }
}
