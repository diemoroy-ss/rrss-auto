import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminStorage } from "../../../../lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return NextResponse.json({ error: "No autorizado. Inicia sesión para continuar." }, { status: 401 });
    }

    const decoded = await adminAuth!.verifyIdToken(token);
    const uid = decoded.uid;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const postId = formData.get("postId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo de imagen." }, { status: 400 });
    }

    if (!postId) {
      return NextResponse.json({ error: "postId es requerido." }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Formato no permitido. Por favor usa JPG, PNG o WebP." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagen muy pesada. El tamaño máximo permitido es 10 MB." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.type.split("/")[1] || "jpg";
    const storagePath = `posts/${uid}/${postId}/base_image_${Date.now()}.${ext}`;

    const bucket = adminStorage!.bucket();
    const fileRef = bucket.file(storagePath);
    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
      resumable: false,
    });
    await fileRef.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Actualizar el documento del post en Firestore
    const postDocRef = adminDb.collection("social_posts").doc(postId);
    const postSnap = await postDocRef.get();
    if (postSnap.exists) {
      const postData = postSnap.data();
      if (postData?.userId === uid || decoded.email === "santisoftai@gmail.com") {
        await postDocRef.update({
          baseImageUrl: publicUrl,
          updatedAt: new Date()
        });
      }
    }

    return NextResponse.json({ success: true, baseImageUrl: publicUrl });
  } catch (err: any) {
    console.error("[UPLOAD BASE IMAGE ERROR]:", err);
    return NextResponse.json({ error: err.message || "Error al subir la imagen base." }, { status: 500 });
  }
}
