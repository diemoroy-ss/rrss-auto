import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID de menú no proporcionado" }, { status: 400 });
    }

    const decodedId = decodeURIComponent(id);
    let uid = decodedId;
    let targetProfileId = "default";

    if (decodedId.includes("___")) {
      const parts = decodedId.split("___");
      uid = parts[0];
      targetProfileId = parts[1];
    }

    const userDocRef = adminDb.collection("users").doc(uid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
    }

    const userData = userSnap.data() || {};
    const profiles: any[] = userData.profiles || [];
    const isTestProfile = targetProfileId.startsWith("prof_test_");

    let profile = profiles.find((p: any) => p.id === targetProfileId);
    if (!profile) {
      if (isTestProfile) {
        return NextResponse.json({ error: "Empresa de prueba no encontrada" }, { status: 404 });
      }
      profile = profiles[0] || {};
    }

    const businessData = {
      name: profile.name || (isTestProfile ? "Nuestra Carta" : (userData.company || userData.name || "Nuestra Carta")),
      rubro: profile.rubro || "Gastronomía & Servicios",
      description: profile.businessDescription || "",
      logoUrl: profile.logoUrl || null,
      phone: profile.phone || (isTestProfile ? null : (userData.phone || null)),
      whatsapp: profile.phone || (isTestProfile ? null : (userData.phone || null)),
      instagramUsername: profile.instagramUsername || null,
      website: profile.website || null,
      address: profile.address || (isTestProfile ? null : (userData.address || null)),
      promotions: profile.promotions || null,
      fidelizacionEnabled: profile.fidelizacionEnabled === true,
      fidelizacionProgramName: profile.fidelizacionConfig?.programName || "Club VIP",
      fidelizacionRewardTitle: profile.fidelizacionConfig?.rewardTitle || "¡Premio Exclusivo!",
      fidelizacionTargetGoal: profile.fidelizacionConfig?.targetGoal || 5,
    };

    // Determinar si la carta digital está habilitada
    const isMenuEnabled = isTestProfile
      ? profile.menuDigitalEnabled !== false
      : (profile.menuDigitalEnabled === true || userData.menuDigitalEnabled === true);

    // Si la carta no ha sido habilitada por el dueño del local
    if (!isMenuEnabled) {
      return NextResponse.json({
        success: true,
        enabled: false,
        message: "La carta digital de este comercio se encuentra inactiva o en preparación.",
        business: businessData,
      });
    }

    // Obtener ítems del catálogo
    const catalogoSnap = await userDocRef
      .collection("catalogo")
      .get();

    let items = catalogoSnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          description: data.description || "",
          type: data.type || "producto",
          category: (data.category && data.category.trim()) || "Destacados",
          subcategory: (data.subcategory && data.subcategory.trim()) || null,
          price: data.price || null,
          offerPrice: data.offerPrice || null,
          imageUrl: data.imageUrl || null,
          profileId: data.profileId || "default",
          active: data.active !== false,
          keepOriginalPhoto: data.keepOriginalPhoto !== false,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null,
        };
      })
      .filter((item) => item.active);

    // Filtrar por el perfil correspondiente (si el usuario tiene múltiples marcas/locales)
    if (targetProfileId && targetProfileId !== "all") {
      if (isTestProfile) {
        // En empresas de prueba, aislar estrictamente sólo los ítems de esta empresa demo
        items = items.filter((item) => item.profileId === targetProfileId);
      } else if (profiles.length > 1) {
        items = items.filter((item) => item.profileId === targetProfileId || (!item.profileId && targetProfileId === "default"));
      }
    }

    // Ordenar categorías: "Promociones", "Destacados" primero si existen, luego alfabéticamente
    const allCategories = Array.from(
      new Set(items.map((i) => i.category || "Destacados"))
    ).sort((a, b) => {
      if (a.toLowerCase().includes("promo") || a.toLowerCase().includes("oferta")) return -1;
      if (b.toLowerCase().includes("promo") || b.toLowerCase().includes("oferta")) return 1;
      if (a.toLowerCase().includes("destacado")) return -1;
      if (b.toLowerCase().includes("destacado")) return 1;
      return a.localeCompare(b);
    });

    return NextResponse.json({
      success: true,
      enabled: true,
      theme: profile.menuTheme || "minimal_clean",
      business: businessData,
      categories: allCategories,
      items,
    });
  } catch (err: any) {
    console.error("[PUBLIC MENU API ERROR]", err);
    return NextResponse.json({ error: "Error al cargar la carta digital" }, { status: 500 });
  }
}
