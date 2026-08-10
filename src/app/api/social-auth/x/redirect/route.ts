export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import * as crypto from 'crypto';

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId');
    const userId = searchParams.get('userId');

    if (!profileId || !userId) {
      return NextResponse.json({ error: 'Faltan parámetros profileId o userId' }, { status: 400 });
    }

    const clientId = process.env.X_CLIENT_ID || process.env.TWITTER_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'X_CLIENT_ID no configurado en servidor' }, { status: 500 });
    }

    const host = req.headers.get('host') || 'localhost:3003';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/social-auth/x/callback`;

    // Generar PKCE Code Verifier y Code Challenge
    const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
    const codeChallenge = base64UrlEncode(
      crypto.createHash('sha256').update(codeVerifier).digest()
    );

    const stateObj = { profileId, userId, codeVerifier };
    const stateStr = Buffer.from(JSON.stringify(stateObj)).toString('base64');

    const scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'].join(' ');

    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', stateStr);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Error al iniciar OAuth de X (Twitter):', error);
    return NextResponse.json({ error: 'Error al iniciar OAuth de X' }, { status: 500 });
  }
}
