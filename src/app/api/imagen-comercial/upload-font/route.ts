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
        console.warn("[upload-font] Token no verificado:", authErr);
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    let fontName = (formData.get("fontName") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo de fuente." }, { status: 400 });
    }

    const originalName = file.name || "CustomFont.ttf";
    const extMatch = originalName.match(/\.(ttf|otf|woff|woff2)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "ttf";

    if (!fontName) {
      fontName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_\-\s]/g, "");
    }
    fontName = fontName.trim() || `CustomFont_${Date.now()}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!adminStorage) {
      return NextResponse.json({ error: "Storage de Firebase no configurado." }, { status: 500 });
    }

    const bucket = adminStorage.bucket();
    const safeFilename = `${fontName.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}.${ext}`;
    const dest = `users/${uid}/custom_fonts/${safeFilename}`;
    const storageFile = bucket.file(dest);

    await storageFile.save(buffer, {
      metadata: {
        contentType: ext === "woff2" ? "font/woff2" : ext === "woff" ? "font/woff" : "font/ttf",
        cacheControl: "public, max-age=31536000",
      },
    });

    await storageFile.makePublic();
    const fontUrl = `https://storage.googleapis.com/${bucket.name}/${dest}`;

    return NextResponse.json({
      success: true,
      fontName,
      fontUrl,
      ext,
    });
  } catch (error: any) {
    console.error("[upload-font] Error subiendo fuente:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar y subir el archivo de fuente." },
      { status: 500 }
    );
  }
}
