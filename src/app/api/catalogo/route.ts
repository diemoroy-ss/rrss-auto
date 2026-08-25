import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

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
      .orderBy("createdAt", "desc")
      .get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    const { name, description, type, price, imageUrl, tags, profileId } = body;
    if (!name || !description || !type || !profileId) {
      return NextResponse.json({ error: "name, description, type y profileId son requeridos" }, { status: 400 });
    }
    const docRef = await catalogoRef(uid).add({
      name: name.trim(),
      description: description.trim(),
      type,
      price: price?.trim() || null,
      imageUrl: imageUrl || null,
      tags: tags || [],
      profileId,
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
    const { id, name, description, type, price, imageUrl, tags, active } = body;
    if (!id) return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (type !== undefined) updates.type = type;
    if (price !== undefined) updates.price = price?.trim() || null;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (tags !== undefined) updates.tags = tags;
    if (active !== undefined) updates.active = active;
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
