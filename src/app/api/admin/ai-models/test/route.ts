import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../../lib/firebase-admin";
import { getFreeModel } from "../../../../../lib/gemini-free";

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("No autorizado");
  }

  const idToken = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  const uid = decodedToken.uid;
  const email = (decodedToken.email || "").toLowerCase();

  // Fast check by recognized admin emails
  if (["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com", "admin@santisoft.cl"].includes(email)) {
    return { uid, email };
  }

  // Fallback to firestore role check
  try {
    if (adminDb) {
      const userDoc = await adminDb.collection("users").doc(uid).get();
      const userData = userDoc.data();
      if (userData?.role === "admin") {
        return { uid, email };
      }
    }
  } catch (dbErr) {
    console.warn("[AI-MODELS-TEST] Firestore role lookup fallback error:", dbErr);
  }

  throw new Error("Permisos insuficientes");
}

export async function POST(req: Request) {
  try {
    await verifyAdmin(req);
    const body = await req.json();
    const { modelName, prompt, systemInstruction } = body;

    if (!modelName || !prompt) {
      return NextResponse.json(
        { error: "modelName y prompt son requeridos" },
        { status: 400 }
      );
    }

    const cleanModelName = modelName.replace(/^models\//, "");
    const startTime = Date.now();

    const model = getFreeModel(cleanModelName, systemInstruction);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const latencyMs = Date.now() - startTime;
    const response = result.response;
    const text = response.text() || "Sin respuesta de texto";
    const candidates = response.candidates || [];

    return NextResponse.json({
      success: true,
      modelName: cleanModelName,
      text,
      latencyMs,
      finishReason: candidates[0]?.finishReason,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[AI-MODELS-TEST] Error:", err);
    return NextResponse.json(
      { error: err.message || "Error al ejecutar prueba de modelo" },
      { status: 500 }
    );
  }
}
