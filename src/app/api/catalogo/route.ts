import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../lib/firebase-admin";

async function getUid(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) throw new Error("No autorizado");
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

function catalogoRef(uid: string) {
  return adminDb.collection("users").doc(uid).collection("catalogo");
}

export async function GET(req: NextRequest) {
  try {
    const uid = await getUid(req);
    const profileId = req.nextUrl.searchParams.get("profileId") || "default";
    const snap = await catalogoRef(uid)
      .where("profileId", "==", profileId)
      .where("active", "==", true)
      .get();
    const items = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      };
    });
    // Ordenar en memoria por fecha de creación descendente
    items.sort((a: any, b: any) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("[CATALOGO GET]", err);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = await getUid(req);
    const body = await req.json();
    const { name, description, type, category, price, offerPrice, includePriceInCopy, imageUrl, tags, profileId, keepOriginalPhoto, fontStyle } = body;
    if (!name || !description || !type || !profileId) {
      return NextResponse.json({ error: "name, description, type y profileId son requeridos" }, { status: 400 });
    }
    const docRef = await catalogoRef(uid).add({
      name: name.trim(),
      description: description.trim(),
      type,
      category: category?.trim() || null,
      price: price?.trim() || null,
      offerPrice: offerPrice?.trim() || null,
      includePriceInCopy: includePriceInCopy !== false,
      imageUrl: imageUrl || null,
      tags: tags || [],
      profileId,
      keepOriginalPhoto: Boolean(keepOriginalPhoto),
      fontStyle: fontStyle || 'script_handwritten',
      active: true,
      createdAt: new Date(),
    });
    return NextResponse.json({ id: docRef.id, success: true });
  } catch (err: any) {
    console.error("[CATALOGO POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const uid = await getUid(req);
    const body = await req.json();
    const { id, name, description, type, category, price, offerPrice, includePriceInCopy, imageUrl, tags, active, keepOriginalPhoto, fontStyle } = body;
    if (!id) return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (type !== undefined) updates.type = type;
    if (category !== undefined) updates.category = category?.trim() || null;
    if (price !== undefined) updates.price = price?.trim() || null;
    if (offerPrice !== undefined) updates.offerPrice = offerPrice?.trim() || null;
    if (includePriceInCopy !== undefined) updates.includePriceInCopy = Boolean(includePriceInCopy);
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (tags !== undefined) updates.tags = tags;
    if (active !== undefined) updates.active = active;
    if (keepOriginalPhoto !== undefined) updates.keepOriginalPhoto = Boolean(keepOriginalPhoto);
    if (fontStyle !== undefined) updates.fontStyle = fontStyle;
    await catalogoRef(uid).doc(id).update(updates);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[CATALOGO PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const uid = await getUid(req);
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    await catalogoRef(uid).doc(id).update({ active: false });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[CATALOGO DELETE]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
