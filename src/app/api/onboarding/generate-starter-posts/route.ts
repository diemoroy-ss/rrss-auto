export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import { generateFreeText } from '../../../../lib/gemini-free';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!adminDb || !adminAuth) {
      return NextResponse.json({ error: 'Base de datos no inicializada' }, { status: 500 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const { profileId } = await req.json().catch(() => ({ profileId: 'default' }));

    // Evitar duplicar si el usuario ya tiene publicaciones
    const existingSnap = await adminDb
      .collection('social_posts')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json({ message: 'El usuario ya cuenta con publicaciones', count: 0 });
    }

    const userSnap = await adminDb.collection('users').doc(userId).get();
    const uData = userSnap.data() || {};
    const profiles = Array.isArray(uData.profiles) ? uData.profiles : [];
    const profile = profiles.find((p: any) => p.id === profileId) || profiles[0] || {};

    const businessName = profile.name || uData.company || uData.displayName || 'Mi Negocio';
    const rubro = profile.rubro || uData.rubro || 'Servicios';
    const description = profile.businessDescription || uData.businessDescription || '';
    const tone = uData.preferredTone || 'cercano, directo y profesional';
    const networks = Array.isArray(uData.preferredPlatforms) && uData.preferredPlatforms.length > 0
      ? uData.preferredPlatforms
      : ['instagram', 'facebook'];

    const effectiveProfileId = profile.id || profileId || 'default';

    // Generar copys humanos usando nuestros agentes
    const prompt = `
Actúa como un redactor profesional de contenido en redes sociales para PyMEs en Chile y LATAM.
Genera exactamente 2 publicaciones para Instagram y Facebook para la siguiente marca:
- Nombre: ${businessName}
- Rubro: ${rubro}
- Descripción: ${description}
- Tono: ${tone}

Reglas estrictas de redacción:
1. Tono 100% natural, directo de "tú a tú", fluido y humano.
2. Cero muletillas de IA (PROHIBIDO usar "en el vertiginoso mundo", "en conclusión", "desbloquea el potencial", "sumérgete en", "leverage", "un sinfín de").
3. Enfocado en los problemas reales y soluciones para los clientes del negocio.
4. Incluye emojis sutiles y de 3 a 5 hashtags relevantes locales.
5. NO menciones que el texto fue hecho por IA.

Devuelve ÚNICAMENTE un JSON válido con este formato exacto:
{
  "post1": {
    "idea": "Breve título de la idea (ej: Lo que debes saber antes de contratar ${rubro})",
    "copy": "Texto completo y persuasivo del post..."
  },
  "post2": {
    "idea": "Breve título de la idea (ej: 3 errores frecuentes que puedes evitar hoy)",
    "copy": "Texto completo y persuasivo del post..."
  }
}
`;

    let post1Data = {
      idea: `Conoce ${businessName}: Soluciones en ${rubro}`,
      copy: `En ${businessName} sabemos que tu tiempo vale oro. Si buscas resolver tus necesidades de ${rubro.toLowerCase()} con confianza, puntualidad y resultados reales, estamos aquí para ayudarte.\n\nEscríbenos por mensaje directo y cuéntanos qué necesitas hoy. 📩\n\n#${rubro.replace(/\s+/g, '')} #PyME #Calidad #Servicio`,
    };

    let post2Data = {
      idea: `Un consejo clave para tu día a día en ${rubro}`,
      copy: `Un error común que vemos a diario es dejar para después las decisiones que pueden ahorrarte tiempo y dolores de cabeza.\n\n¿Cuál es el principal desafío que enfrentas actualmente con tus proyectos? Cuéntanos en los comentarios 👇\n\n#${rubro.replace(/\s+/g, '')} #Tips #Crecimiento #Consejos`,
    };

    try {
      const rawAi = await generateFreeText(prompt, undefined, true);
      const cleanJson = rawAi.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.post1?.copy) post1Data = parsed.post1;
      if (parsed.post2?.copy) post2Data = parsed.post2;
    } catch (e) {
      console.warn('[generate-starter-posts] Usando plantilla humana por fallback:', e);
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);

    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);
    inThreeDays.setHours(18, 30, 0, 0);

    const batch = adminDb.batch();

    const postRef1 = adminDb.collection('social_posts').doc();
    batch.set(postRef1, {
      userId,
      profileId: effectiveProfileId,
      idea: post1Data.idea,
      copy: post1Data.copy,
      postText: post1Data.copy,
      networks,
      status: 'pending',
      postType: 'feed',
      format: 'image',
      scheduledFor: tomorrow,
      createdAt: new Date(),
      isStarterDraft: true,
      visualStyle: profile.visualIdentity?.style || 'clean',
    });

    const postRef2 = adminDb.collection('social_posts').doc();
    batch.set(postRef2, {
      userId,
      profileId: effectiveProfileId,
      idea: post2Data.idea,
      copy: post2Data.copy,
      postText: post2Data.copy,
      networks,
      status: 'pending',
      postType: 'feed',
      format: 'image',
      scheduledFor: inThreeDays,
      createdAt: new Date(),
      isStarterDraft: true,
      visualStyle: profile.visualIdentity?.style || 'clean',
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      count: 2,
      posts: [postRef1.id, postRef2.id],
    });
  } catch (error: any) {
    console.error('[generate-starter-posts] Error:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
