import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = [
  "admin@santisoft.cl",
  "diemoroy@gmail.com",
  "spalezcom@gmail.com",
  "santisoftai@gmail.com",
];

async function verifyAdminCaller(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Falta token de autorización", status: 401 };
  }
  const token = authHeader.split("Bearer ")[1];
  if (!adminAuth || !adminDb) {
    return { error: "Firebase Admin no disponible", status: 500 };
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const email = (decodedToken.email || "").toLowerCase();
    const isSuperAdmin = ADMIN_EMAILS.includes(email);

    if (isSuperAdmin) {
      return { uid: decodedToken.uid, email };
    }

    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (userDoc.data()?.role === "admin") {
      return { uid: decodedToken.uid, email };
    }

    return { error: "Acceso denegado: se requieren permisos de administrador", status: 403 };
  } catch (err: any) {
    return { error: "Token inválido o expirado", status: 401 };
  }
}

// GET: Listar todos los vendedores y sus estadísticas
export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminCaller(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Buscar usuarios con rol 'vendedor'
    const vendedoresSnapshot = await adminDb!
      .collection("users")
      .where("role", "==", "vendedor")
      .get();

    // Obtener todas las muestras para contar cuántas ha creado cada vendedor
    const demosSnapshot = await adminDb!.collection("admin_prospect_demos").get();
    const demosPerSeller: Record<string, number> = {};
    demosSnapshot.forEach((doc) => {
      const data = doc.data();
      const sellerId = data.createdBy;
      if (sellerId) {
        demosPerSeller[sellerId] = (demosPerSeller[sellerId] || 0) + 1;
      }
    });

    const vendedores = vendedoresSnapshot.docs.map((doc) => {
      const data = doc.data();
      let createdAtIso = null;
      if (data.createdAt?.toDate) {
        createdAtIso = data.createdAt.toDate().toISOString();
      } else if (data.createdAt) {
        createdAtIso = new Date(data.createdAt).toISOString();
      }

      return {
        id: doc.id,
        name: data.name || "Sin nombre",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role,
        isDisabled: Boolean(data.isDisabled),
        demosCount: demosPerSeller[doc.id] || 0,
        createdAt: createdAtIso,
      };
    });

    // Ordenar por cantidad de demos y luego nombre
    vendedores.sort((a, b) => b.demosCount - a.demosCount || a.name.localeCompare(b.name));

    return NextResponse.json({ success: true, vendedores });
  } catch (error: any) {
    console.error("[GET /api/admin/vendedores] Error:", error);
    return NextResponse.json({ error: error.message || "Error al obtener vendedores" }, { status: 500 });
  }
}

// POST: Crear nuevo vendedor con usuario y contraseña
export async function POST(req: Request) {
  try {
    const authResult = await verifyAdminCaller(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { name, email, password, phone } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "El nombre del vendedor es obligatorio" }, { status: 400 });
    }
    if (!email?.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "Ingresa un correo electrónico válido" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone?.trim() || "";

    let uid = "";

    // 1. Verificar si el usuario ya existe en Firebase Auth
    try {
      const existingUser = await adminAuth!.getUserByEmail(cleanEmail);
      uid = existingUser.uid;

      // Actualizar su contraseña y nombre en Auth
      await adminAuth!.updateUser(uid, {
        password,
        displayName: cleanName,
        disabled: false,
      });
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        // Crear nuevo usuario en Firebase Auth
        const newUser = await adminAuth!.createUser({
          email: cleanEmail,
          password,
          displayName: cleanName,
          emailVerified: true,
        });
        uid = newUser.uid;
      } else {
        throw err;
      }
    }

    // 2. Crear o actualizar documento en Firestore 'users/{uid}' con rol 'vendedor'
    const userDocRef = adminDb!.collection("users").doc(uid);
    const existingDoc = await userDocRef.get();

    const userDataToSave = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: "vendedor",
      plan: "free",
      registeredApps: ["muestras", "vendedores"],
      isDisabled: false,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existingDoc.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      assignedBy: authResult.uid,
    };

    await userDocRef.set(userDataToSave, { merge: true });

    return NextResponse.json({
      success: true,
      message: `Vendedor ${cleanName} registrado correctamente con rol comercial`,
      vendedor: {
        id: uid,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: "vendedor",
        demosCount: 0,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/admin/vendedores] Error:", error);
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json({ error: "Este correo ya está registrado en Firebase" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Error al crear vendedor" }, { status: 500 });
  }
}

// PATCH: Cambiar contraseña, suspender o editar vendedor
export async function PATCH(req: Request) {
  try {
    const authResult = await verifyAdminCaller(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { userId, newPassword, name, phone, isDisabled } = body;

    if (!userId) {
      return NextResponse.json({ error: "El userId es obligatorio" }, { status: 400 });
    }

    const authUpdates: Record<string, any> = {};
    const firestoreUpdates: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Cambio de contraseña
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 });
      }
      authUpdates.password = newPassword;
    }

    // Nombre
    if (name?.trim()) {
      authUpdates.displayName = name.trim();
      firestoreUpdates.name = name.trim();
    }

    // Teléfono
    if (phone !== undefined) {
      firestoreUpdates.phone = phone.trim();
    }

    // Estado (suspender / activar)
    if (typeof isDisabled === "boolean") {
      authUpdates.disabled = isDisabled;
      firestoreUpdates.isDisabled = isDisabled;
    }

    // Aplicar cambios en Auth
    if (Object.keys(authUpdates).length > 0) {
      await adminAuth!.updateUser(userId, authUpdates);
    }

    // Aplicar cambios en Firestore
    await adminDb!.collection("users").doc(userId).update(firestoreUpdates);

    return NextResponse.json({
      success: true,
      message: "Vendedor actualizado exitosamente",
    });
  } catch (error: any) {
    console.error("[PATCH /api/admin/vendedores] Error:", error);
    return NextResponse.json({ error: error.message || "Error al actualizar vendedor" }, { status: 500 });
  }
}

// DELETE: Revocar acceso o eliminar vendedor
export async function DELETE(req: Request) {
  try {
    const authResult = await verifyAdminCaller(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Falta userId" }, { status: 400 });
    }

    // Cambiar rol a 'user' y suspender cuenta para bloquear acceso a la PWA de vendedores
    await adminAuth!.updateUser(userId, { disabled: true });
    await adminDb!.collection("users").doc(userId).update({
      role: "user",
      isDisabled: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Acceso de vendedor revocado y cuenta suspendida",
    });
  } catch (error: any) {
    console.error("[DELETE /api/admin/vendedores] Error:", error);
    return NextResponse.json({ error: error.message || "Error al revocar vendedor" }, { status: 500 });
  }
}
