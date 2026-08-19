import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import { generateNicheRadarAnalysis } from '../../../../lib/niche-radar';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { niche, businessName, targetAudience, customKeywords, forceRefresh, checkCacheOnly, userId, businessId } = body;

    if (!niche || typeof niche !== 'string' || !niche.trim()) {
      return NextResponse.json({ error: 'Debes especificar un nicho o rubro para analizar.' }, { status: 400 });
    }

    // Opcional: Autenticación por token de Firebase si viene presente en los headers
    let authUid = userId;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ') && adminAuth) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        authUid = decodedToken.uid;
      } catch (authErr) {
        console.warn('Token no válido en api/nicho/radar, procediendo con fallback:', authErr);
      }
    }

    // Verificar si existe caché reciente en Firestore si no es forceRefresh
    if (!forceRefresh && authUid && businessId && adminDb) {
      try {
        const radarRef = adminDb.collection('users').doc(authUid).collection('businesses').doc(businessId).collection('radar');
        const cacheSnap = await radarRef.orderBy('createdAt', 'desc').limit(1).get();
        if (!cacheSnap.empty) {
          const cachedData = cacheSnap.docs[0].data();
          const docId = cacheSnap.docs[0].id;
          const createdAt = cachedData?.createdAt ? new Date(cachedData.createdAt).getTime() : (cachedData?.updatedAt ? new Date(cachedData.updatedAt).getTime() : 0);
          const hoursAgo = (Date.now() - createdAt) / (1000 * 60 * 60);
          
          // Retornar si es checkCacheOnly (UI usa esto para cargar el último sin importar el nicho), 
          // O si el nicho coincide y tiene menos de 24 horas.
          if (checkCacheOnly || (hoursAgo < 24 && cachedData?.niche?.toLowerCase() === niche.trim().toLowerCase())) {
            return NextResponse.json({ success: true, analysis: { id: docId, ...cachedData }, fromCache: true });
          }
        }
      } catch (cacheErr) {
        console.warn('Error al verificar caché de Firestore:', cacheErr);
      }
    }

    // Si solo estábamos comprobando la presencia de caché y no existe
    if (checkCacheOnly) {
      return NextResponse.json({ success: false, noCache: true });
    }

    // Generar nuevo análisis de la IA
    const analysis = await generateNicheRadarAnalysis({
      businessName: businessName || 'Mi Negocio',
      niche: niche.trim(),
      targetAudience: targetAudience || 'Público General',
      customKeywords: customKeywords || '',
    });

    // Guardar en Firestore si tenemos datos del usuario y negocio
    if (authUid && businessId && adminDb) {
      try {
        const radarRef = adminDb.collection('users').doc(authUid).collection('businesses').doc(businessId).collection('radar');
        const newDoc = await radarRef.add({
            ...analysis,
            createdAt: new Date().toISOString() // add explicit createdAt for sorting
        });
        analysis.id = newDoc.id; // attach generated ID
      } catch (saveErr) {
        console.warn('Error al guardar el radar en Firestore:', saveErr);
      }
    }

    return NextResponse.json({ success: true, analysis, fromCache: false });

  } catch (error: any) {
    console.error('Error en API Radar de Nicho:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al generar el análisis del nicho.' },
      { status: 500 }
    );
  }
}
