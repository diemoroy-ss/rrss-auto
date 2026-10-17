import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminStorage } from "../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    let uid = "anon";

    if (token && adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
      } catch (authErr) {
        console.warn("[upload-asset] Token no verificado:", authErr);
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const assetType = (formData.get("type") as string) || "asset"; // "base_image", "logo", "rendered"

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo." }, { status: 400 });
    }

    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Formato no permitido. Usa JPG, PNG, WebP o GIF." },
        { status: 400 }
      );
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen excede el límite de 15 MB." }, { status: 400 });
    }

    if (!adminStorage) {
      return NextResponse.json({ error: "Storage de Firebase no configurado." }, { status: 500 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const ext = extMap[file.type.toLowerCase()] || "png";
    const bucket = adminStorage.bucket();
    const dest = `users/${uid}/commercial_assets/${assetType}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const storageFile = bucket.file(dest);

    await storageFile.save(buffer, {
      metadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000",
      },
    });

    await storageFile.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${dest}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error: any) {
    console.error("[upload-asset] Error subiendo imagen:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la imagen." },
      { status: 500 }
    );
  }
}
