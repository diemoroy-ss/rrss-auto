import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import { TEST_COMPANY_TEMPLATES } from '../../../../lib/test-company-templates';

const ADMIN_EMAILS = [
  'santisoftai@gmail.com',
  'diemoroy@gmail.com',
  'spalezcom@gmail.com',
  'admin@santisoft.cl',
];

async function verifyAdmin(req: NextRequest): Promise<{ uid: string; email: string }> {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) throw new Error('No autorizado');

  if (!adminAuth || !adminDb) {
    throw new Error('Firebase Admin no está inicializado');
  }

  const decoded = await adminAuth.verifyIdToken(token);
  const email = (decoded.email || '').toLowerCase().trim();

  if (ADMIN_EMAILS.includes(email)) {
    return { uid: decoded.uid, email };
  }

  const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
  if (userDoc.exists && userDoc.data()?.role === 'admin') {
    return { uid: decoded.uid, email };
  }

  throw new Error('Acceso denegado: se requieren permisos de administrador');
}

export async function GET(req: NextRequest) {
  try {
    await verifyAdmin(req);
    return NextResponse.json({ success: true, templates: TEST_COMPANY_TEMPLATES });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error de autorización' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid } = await verifyAdmin(req);
    const body = await req.json();

    const {
      name,
      icon,
      rubro,
      businessDescription,
      promotions,
      phone,
      website,
      menuDigitalEnabled,
      menuTheme,
      bannerStyle,
      photoTreatment,
      sampleProducts = [],
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre de la empresa es obligatorio' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = userDoc.data() || {};
    const existingProfiles = userData.profiles || [];

    const profileId = `prof_test_${Date.now()}`;
    const newProfile = {
      id: profileId,
      name: name.trim(),
      icon: icon || '🏢',
      rubro: rubro?.trim() || '',
      businessDescription: businessDescription?.trim() || '',
      promotions: promotions?.trim() || '',
      phone: phone?.trim() || '',
      website: website?.trim() || '',
      menuDigitalEnabled: menuDigitalEnabled !== false,
      menuTheme: menuTheme || 'dark_modern',
      bannerStyle: bannerStyle || 'banner',
      photoTreatment: photoTreatment || 'clean',
      visualIdentity: {
        styleMix: (Array.isArray(body.recommendedStyles) && body.recommendedStyles.length > 0
          ? body.recommendedStyles
          : ['style-food-combo-ad', 'style-food-hero-poster']
        ).map((s: string) => ({ styleId: s, weight: 1 })),
        lockStyle: false,
      },
      agentTone: 'directo_cercano',
      isTestProfile: true,
      createdAt: new Date().toISOString(),
    };

    // Actualizar los perfiles del usuario en Firebase
    await userRef.update({
      profiles: [...existingProfiles, newProfile],
    });

    // Cargar productos de prueba en el catálogo si se proveyeron
    let createdCount = 0;
    if (Array.isArray(sampleProducts) && sampleProducts.length > 0) {
      const catalogoColl = userRef.collection('catalogo');
      const batch = adminDb.batch();

      for (const prod of sampleProducts) {
        if (!prod.name) continue;
        const docRef = catalogoColl.doc();
        batch.set(docRef, {
          name: prod.name.trim(),
          description: prod.description?.trim() || '',
          type: prod.type || 'producto',
          category: prod.category?.trim() || null,
          subcategory: prod.subcategory?.trim() || null,
          price: prod.price?.trim() || null,
          offerPrice: prod.offerPrice?.trim() || null,
          includePriceInCopy: prod.includePriceInCopy !== false,
          imageUrl: prod.imageUrl || null,
          tags: Array.isArray(prod.tags) ? prod.tags : [],
          profileId: profileId,
          keepOriginalPhoto: prod.keepOriginalPhoto !== false,
          fontStyle: prod.fontStyle || 'bold_modern',
          active: true,
          createdAt: new Date(),
        });
        createdCount++;
      }

      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      profile: newProfile,
      productsCreated: createdCount,
    });
  } catch (error: any) {
    console.error('Error creating test company:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { uid } = await verifyAdmin(req);
    const { profileId } = await req.json();

    if (!profileId || profileId === 'default') {
      return NextResponse.json({ error: 'No se puede eliminar la cuenta principal o ID inválido' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = userDoc.data() || {};
    const existingProfiles = userData.profiles || [];
    const updatedProfiles = existingProfiles.filter((p: any) => p.id !== profileId);

    // 1. Eliminar ítems de catálogo asociados a este perfil
    const catalogoSnap = await userRef.collection('catalogo').where('profileId', '==', profileId).get();
    if (!catalogoSnap.empty) {
      const batch = adminDb.batch();
      catalogoSnap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // 2. Eliminar posts agendados/de prueba asociados a este perfil
    const postsSnap = await adminDb.collection('social_posts')
      .where('userId', '==', uid)
      .where('profileId', '==', profileId)
      .get();
    if (!postsSnap.empty) {
      const batch = adminDb.batch();
      postsSnap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // 3. Actualizar la lista de perfiles
    await userRef.update({
      profiles: updatedProfiles,
    });

    return NextResponse.json({
      success: true,
      message: 'Empresa de prueba y todos sus productos eliminados correctamente',
    });
  } catch (error: any) {
    console.error('Error deleting test company:', error);
    return NextResponse.json({ error: error.message || 'Error interno al eliminar empresa' }, { status: 500 });
  }
}
