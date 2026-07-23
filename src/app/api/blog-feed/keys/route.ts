import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

function generateApiKey(): string {
  const token = randomBytes(24).toString('hex');
  return `sk_live_${token}`;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Se requiere autenticación' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);

    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const existingKeys: string[] = userSnap.data()?.seoApiKeys || [];

    return NextResponse.json({ keys: existingKeys.map((k) => ({
      keyPreview: k.substring(0, 14) + '••••••••••••••••',
      keyFull: k,
    })) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Se requiere autenticación' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);

    const userRef = adminDb.collection('users').doc(decoded.uid);
    const userSnap = await userRef.get();
    const existingKeys: string[] = userSnap.data()?.seoApiKeys || [];

    if (existingKeys.length >= 5) {
      return NextResponse.json(
        { error: 'Límite de 5 API Keys por cuenta alcanzado. Revoca una antes de crear una nueva.' },
        { status: 400 }
      );
    }

    const newKey = generateApiKey();
    await userRef.update({
      seoApiKeys: [...existingKeys, newKey],
    });

    return NextResponse.json({ key: newKey, message: 'API Key generada. Guárdala en un lugar seguro, no volverá a mostrarse completa.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Se requiere autenticación' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);

    const body = await req.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json({ error: 'Se requiere el campo key' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(decoded.uid);
    const userSnap = await userRef.get();
    const existingKeys: string[] = userSnap.data()?.seoApiKeys || [];

    const filtered = existingKeys.filter((k) => k !== key);
    if (filtered.length === existingKeys.length) {
      return NextResponse.json({ error: 'Key no encontrada' }, { status: 404 });
    }

    await userRef.update({ seoApiKeys: filtered });

    return NextResponse.json({ message: 'API Key revocada correctamente.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
