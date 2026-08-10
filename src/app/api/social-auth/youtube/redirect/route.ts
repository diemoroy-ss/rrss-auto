import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId');
    const userId = searchParams.get('userId');

    if (!profileId || !userId) {
      return NextResponse.json({ error: 'Faltan parámetros profileId o userId' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'GOOGLE_CLIENT_ID no configurado en servidor' }, { status: 500 });
    }

    const host = req.headers.get('host') || 'localhost:3003';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/social-auth/youtube/callback`;

    const stateObj = { profileId, userId };
    const stateStr = Buffer.from(JSON.stringify(stateObj)).toString('base64');

    const scopes = [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
    ].join(' ');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', stateStr);

    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Error al iniciar OAuth de YouTube:', error);
    return NextResponse.json({ error: 'Error al iniciar OAuth de YouTube' }, { status: 500 });
  }
}
