import { NextResponse } from "next/server";
import { adminAuth } from "../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Falta token de autenticación" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    if (!adminAuth) {
      return NextResponse.json({ error: "Firebase Admin no disponible" }, { status: 500 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Actualizar contraseña directamente en Firebase Auth
    await adminAuth.updateUser(userId, {
      password: newPassword,
    });

    return NextResponse.json({
      success: true,
      message: "Tu contraseña ha sido actualizada exitosamente",
    });
  } catch (error: any) {
    console.error("[POST /api/vendedores/change-password] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar la contraseña" },
      { status: 500 }
    );
  }
}
