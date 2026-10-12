export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import { isAdminAdmin } from '../../../../lib/quota-admin';
import { FLOW_COMMANDS, FlowCommandDef } from '../../../../lib/flow-command-translator';

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ templates: FLOW_COMMANDS });
    }

    const snap = await adminDb.collection('flow_video_templates').get();
    const dbMap: Record<string, Partial<FlowCommandDef>> = {};

    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.command) {
        dbMap[data.command] = {
          ...data,
          id: doc.id
        } as any;
      }
    });

    // Combinar los comandos estáticos base con las personalizaciones guardadas en Firestore
    const mergedTemplates = FLOW_COMMANDS.map((baseCmd) => {
      const custom = dbMap[baseCmd.command];
      if (custom) {
        if ((custom as any).deleted) return null;
        return {
          ...baseCmd,
          ...custom
        };
      }
      return baseCmd;
    }).filter(Boolean) as FlowCommandDef[];

    // Añadir comandos adicionales creados exclusivamente por el admin
    const baseCommandSet = new Set(FLOW_COMMANDS.map((c) => c.command));
    Object.values(dbMap).forEach((customCmd: any) => {
      if (customCmd.command && !baseCommandSet.has(customCmd.command) && !customCmd.deleted) {
        mergedTemplates.push({
          command: customCmd.command,
          name: customCmd.name || customCmd.command,
          category: customCmd.category || "Product Reveals",
          description: customCmd.description || "",
          icon: customCmd.icon || "🎬",
          cameraMovement: customCmd.cameraMovement || "Slow cinematic camera push-in",
          physicsEffect: customCmd.physicsEffect || "",
          lightingStyle: customCmd.lightingStyle || "Commercial studio illumination",
          defaultEnglishPrompt: customCmd.defaultEnglishPrompt || "",
          sampleBaseImage: customCmd.sampleBaseImage || "",
          sampleFinalVideo: customCmd.sampleFinalVideo || "",
        });
      }
    });

    return NextResponse.json({ templates: mergedTemplates });
  } catch (error: any) {
    console.error('Error fetching flow video templates:', error);
    return NextResponse.json({ templates: FLOW_COMMANDS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Falta token de autenticación' }, { status: 401 });
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
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
      // Verificar si en users/{uid} tiene rol admin
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      if (userDoc.data()?.role !== 'admin') {
        return NextResponse.json({ error: 'Acceso restringido para administradores' }, { status: 403 });
      }
    }

    const body = await req.json();
    const {
      command,
      name,
      category = 'Product Reveals',
      description = '',
      icon = '🎬',
      cameraMovement = '',
      physicsEffect = '',
      lightingStyle = '',
      defaultEnglishPrompt = '',
      sampleBaseImage = '',
      sampleFinalVideo = ''
    } = body;

    if (!command || typeof command !== 'string' || !command.startsWith('/')) {
      return NextResponse.json({ error: 'El comando es requerido y debe iniciar con / (ej: /smoke reveal)' }, { status: 400 });
    }

    const safeDocId = command.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const docRef = adminDb.collection('flow_video_templates').doc(safeDocId);

    const templateData = {
      command: command.trim(),
      name: name?.trim() || command.trim(),
      category,
      description,
      icon,
      cameraMovement,
      physicsEffect,
      lightingStyle,
      defaultEnglishPrompt,
      sampleBaseImage,
      sampleFinalVideo,
      deleted: false,
      updatedAt: new Date().toISOString(),
      updatedBy: decoded.email || decoded.uid
    };

    await docRef.set(templateData, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Muestra de video guardada exitosamente en la galería',
      template: templateData
    });
  } catch (error: any) {
    console.error('Error guardando template de video:', error);
    return NextResponse.json({ error: error?.message || 'Error del servidor al guardar template' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Falta token de autenticación' }, { status: 401 });
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    if (!isAdminAdmin(decoded.email)) {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      if (userDoc.data()?.role !== 'admin') {
        return NextResponse.json({ error: 'Acceso restringido para administradores' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const command = searchParams.get('command');

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Comando requerido para eliminar' }, { status: 400 });
    }

    const safeDocId = command.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const docRef = adminDb.collection('flow_video_templates').doc(safeDocId);

    // Guardar marca deleted: true
    await docRef.set({
      command: command.trim(),
      deleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: decoded.email || decoded.uid
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: `Efecto ${command} eliminado correctamente de la galería.`
    });
  } catch (error: any) {
    console.error('Error eliminando template de video:', error);
    return NextResponse.json({ error: error?.message || 'Error del servidor al eliminar template' }, { status: 500 });
  }
}

