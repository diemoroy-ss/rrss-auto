export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminStorage, adminDb } from '../../../../lib/firebase-admin';
import { isAdminAdmin } from '../../../../lib/quota-admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Falta token de autenticación' }, { status: 401 });
    }

    if (!adminAuth || !adminStorage) {
      return NextResponse.json({ error: 'Firebase Admin Storage no configurado' }, { status: 500 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar si es administrador
    if (!isAdminAdmin(decoded.email)) {
      const userDoc = await adminDb?.collection('users').doc(decoded.uid).get();
      if (userDoc?.data()?.role !== 'admin') {
        return NextResponse.json({ error: 'Acceso restringido para administradores' }, { status: 403 });
      }
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'image'; // 'image' | 'video'
    const command = (formData.get('command') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const commandSlug = command.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
    const storagePath = `flow_showcase/${commandSlug}_${type}_${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type || (type === 'video' ? 'video/mp4' : 'image/jpeg') },
      resumable: false,
    });

    try {
      await fileRef.makePublic();
    } catch (e) {
      // Ignorar si el bucket no tiene permisos de makePublic directo
    }

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      type,
      storagePath
    });
  } catch (error: any) {
    console.error('Error subiendo muestra a storage:', error);
    return NextResponse.json({ error: error?.message || 'Error al subir archivo de muestra' }, { status: 500 });
  }
}
