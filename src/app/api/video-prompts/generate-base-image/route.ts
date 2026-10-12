export const dynamic = 'force-dynamic';
export const maxDuration = 90;

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import { 
  isAdminAdmin, 
  getAiPlanLimitAdmin, 
  getAiGenerationUsageAdmin, 
  logAiGenerationAdmin 
} from '../../../../lib/quota-admin';
import { generateImageWithAgent } from '../../../../lib/agents/agent-image';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Falta token de autenticación' }, { status: 401 });
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin no está configurado' }, { status: 500 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    const uid = decoded.uid;
    const email = decoded.email || '';

    const body = await req.json();
    const { 
      productName, 
      rubro, 
      description, 
      aspectRatio = '9:16',
      commandCategory
    } = body;

    if (!productName || typeof productName !== 'string' || !productName.trim()) {
      return NextResponse.json({ error: 'El nombre del producto o servicio es obligatorio' }, { status: 400 });
    }

    // 1. Obtener datos del usuario y perfil
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const plan = userData?.plan || 'free';
    const profiles = userData?.profiles || [];
    const targetProfile = profiles[0] || {};
    const effectiveRubro = rubro || targetProfile?.rubro || 'Comercial';

    // 2. Verificación de cuotas de imágenes
    const isAdmin = isAdminAdmin(email) || userData?.role === 'admin';
    if (!isAdmin) {
      const [limit, used] = await Promise.all([
        getAiPlanLimitAdmin(plan, 'image', email),
        getAiGenerationUsageAdmin(uid, 'image').catch(() => 0)
      ]);

      if (used >= limit) {
        return NextResponse.json({ 
          error: `Has alcanzado el límite de imágenes de tu plan (${used}/${limit}). Mejora tu plan para continuar.` 
        }, { status: 403 });
      }
    }

    // 3. Formular prompt publicitario para fotografía comercial limpia
    const categoryContext = commandCategory 
      ? ` Orientado al estilo visual de ${commandCategory}.`
      : '';

    const photoIdea = `Fotografía comercial publicitaria en alta definición para el producto o servicio "${productName.trim()}". ${description?.trim() ? `Detalles: ${description.trim()}.` : ''}${categoryContext} Encuadre publicitario nítido, iluminación de estudio profesional de alta gama, fondo limpio y composición visual impecable calibrada como imagen base para video publicitario.`;

    // 4. Invocar a nuestros agentes de imagen en modo limpio (sin textos ni banners)
    const imageUrl = await generateImageWithAgent({
      idea: photoIdea,
      rubro: effectiveRubro,
      businessName: targetProfile?.businessName || '',
      businessDescription: targetProfile?.businessDescription || '',
      productName: productName.trim(),
      productDescription: description?.trim() || undefined,
      aspectRatio: aspectRatio === '1:1' ? '1:1' : '9:16',
      bannerStyle: 'clean',
      userId: uid,
      brandVisualIdentity: targetProfile?.brandVisualIdentity
    });

    if (!imageUrl) {
      return NextResponse.json({ error: 'Nuestros agentes no pudieron generar la imagen. Intenta nuevamente.' }, { status: 500 });
    }

    // 5. Registrar consumo en cuotas
    if (!isAdmin) {
      await logAiGenerationAdmin(uid, targetProfile?.id || 'default', 'image', {
        source: 'video_base_image',
        productName: productName.trim(),
        rubro: effectiveRubro
      });
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      productName: productName.trim(),
      description: description?.trim() || ''
    });

  } catch (error: any) {
    console.error('Error generando imagen base para video:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno al generar imagen base' 
    }, { status: 500 });
  }
}
