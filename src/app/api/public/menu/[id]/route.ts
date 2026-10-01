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

    let uid = id;
    let targetProfileId = "default";

    if (id.includes("___")) {
      const parts = id.split("___");
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
    const profile = profiles.find((p: any) => p.id === targetProfileId) || profiles[0] || {};

    // Obtener ítems del catálogo activos
    const catalogoSnap = await userDocRef
      .collection("catalogo")
      .where("active", "==", true)
      .get();

    let items = catalogoSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "",
        description: data.description || "",
        type: data.type || "producto",
        category: (data.category && data.category.trim()) || "Destacados",
        price: data.price || null,
        offerPrice: data.offerPrice || null,
        imageUrl: data.imageUrl || null,
        profileId: data.profileId || "default",
        keepOriginalPhoto: data.keepOriginalPhoto !== false,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null,
      };
    });

    // Filtrar por el perfil correspondiente (si el usuario tiene múltiples marcas/locales)
    if (profiles.length > 1 && targetProfileId !== "all") {
      items = items.filter((item) => item.profileId === targetProfileId || !item.profileId);
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
      business: {
        name: profile.name || userData.company || userData.name || "Nuestra Carta",
        rubro: profile.rubro || "Gastronomía & Servicios",
        description: profile.businessDescription || "",
        logoUrl: profile.logoUrl || null,
        phone: profile.phone || userData.phone || null,
        whatsapp: profile.phone || userData.phone || null,
        instagramUsername: profile.instagramUsername || null,
        website: profile.website || null,
        address: profile.address || userData.address || null,
        promotions: profile.promotions || null,
      },
      categories: allCategories,
      items,
    });
  } catch (err: any) {
    console.error("[PUBLIC MENU API ERROR]", err);
    return NextResponse.json({ error: "Error al cargar la carta digital" }, { status: 500 });
  }
}
