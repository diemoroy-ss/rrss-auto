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
      console.warn('OAuth YouTube cancelado o fallido:', errorParam);
      return NextResponse.redirect(`${configPageUrl}?youtube_error=cancelled`);
    }

    let stateObj: { profileId: string; userId: string };
    try {
      stateObj = JSON.parse(Buffer.from(stateStr, 'base64').toString('utf-8'));
    } catch {
      return NextResponse.redirect(`${configPageUrl}?youtube_error=invalid_state`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${protocol}://${host}/api/social-auth/youtube/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${configPageUrl}?youtube_error=missing_credentials`);
    }

    // 1. Intercambiar code por tokens en Google OAuth2
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Error al obtener tokens de YouTube:', tokenData);
      return NextResponse.redirect(`${configPageUrl}?youtube_error=token_failed`);
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || '';

    // 2. Obtener información del canal de YouTube del usuario
    let channelName = 'Canal de YouTube';
    let channelId = '';

    try {
      const channelRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?mine=true&part=snippet',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const channelData = await channelRes.json();
      if (channelData.items && channelData.items.length > 0) {
        channelName = channelData.items[0].snippet.title || channelName;
        channelId = channelData.items[0].id || '';
      }
    } catch (chErr) {
      console.warn('No se pudo consultar el nombre del canal de YouTube:', chErr);
    }

    // 3. Guardar encriptado en Firestore
    if (adminDb && stateObj.userId && stateObj.profileId) {
      const businessRef = adminDb
        .collection('users')
        .doc(stateObj.userId)
        .collection('businesses')
        .doc(stateObj.profileId);

      const encAccessToken = encrypt(accessToken);
      const encRefreshToken = refreshToken ? encrypt(refreshToken) : '';

      await businessRef.set(
        {
          accounts: {
            youtube: {
              connected: true,
              channelName,
              channelId,
              token: encAccessToken,
              refreshToken: encRefreshToken,
              updatedAt: new Date().toISOString(),
            },
          },
        },
        { merge: true }
      );
    }

    return NextResponse.redirect(`${configPageUrl}?youtube=success`);
  } catch (error: any) {
    console.error('Error inesperado en callback de YouTube:', error);
    return NextResponse.redirect('/automatizacion-rrss/panel/configuracion?youtube_error=server_error');
  }
}
