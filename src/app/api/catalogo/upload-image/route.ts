import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminStorage } from "../../../../../lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const decoded = await adminAuth!.verifyIdToken(token);
    const uid = decoded.uid;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const profileId = (formData.get("profileId") as string) || "default";

    if (!file) return NextResponse.json({ error: "No se recibio ningun archivo" }, { status: 400 });

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Formato no permitido. Usa JPG, PNG o WebP." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagen muy grande. Maximo 5 MB." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.type.split("/")[1] || "jpg";
    const path = "catalogo/" + uid + "/" + profileId + "/" + Date.now() + "." + ext;

    const bucket = adminStorage!.bucket();
    const fileRef = bucket.file(path);
    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
      resumable: false,
    });
    await fileRef.makePublic();

    const publicUrl = "https://storage.googleapis.com/" + bucket.name + "/" + path;
    return NextResponse.json({ url: publicUrl, success: true });
  } catch (err: any) {
    console.error("[CATALOGO UPLOAD]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
