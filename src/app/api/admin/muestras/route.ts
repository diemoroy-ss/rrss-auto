import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com", "admin@santisoft.cl"];

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "No token", status: 401 };
  }
  const token = authHeader.split("Bearer ")[1];
  if (!adminAuth) {
    return { error: "Firebase Admin no configurado", status: 500 };
  }
  const decoded = await adminAuth.verifyIdToken(token);
  const email = (decoded.email || "").toLowerCase();
  if (ADMIN_EMAILS.includes(email)) {
    return { uid: decoded.uid, email };
  }
  // Check role in users collection
  const userDoc = await adminDb!.collection("users").doc(decoded.uid).get();
  if (userDoc.data()?.role === "admin") {
    return { uid: decoded.uid, email };
  }
  return { error: "Unauthorized", status: 403 };
}

// POST: Crear o actualizar una muestra para prospecto
export async function POST(req: Request) {
  try {
    const authResult = await verifyAdmin(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin DB no disponible" }, { status: 500 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rrss.santisoft.cl";

    if (id) {
      // Actualizar existente
      await adminDb.collection("admin_prospect_demos").doc(id).set(
        {
          ...data,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      return NextResponse.json({ success: true, demoId: id, publicDemoUrl: `${baseUrl}/m/${id}` });
    } else {
      // Crear nueva
      const docRef = await adminDb.collection("admin_prospect_demos").add({
        ...data,
        createdAt: new Date(),
        status: data.status || "generada",
      });

      const demoId = docRef.id;
      const publicDemoUrl = `${baseUrl}/m/${demoId}`;

      await docRef.update({ publicDemoUrl });

      return NextResponse.json({ success: true, demoId, publicDemoUrl });
    }
  } catch (err: any) {
    console.error("[API Admin Muestras POST Error]:", err);
    return NextResponse.json({ error: err.message || "Error interno al guardar la muestra" }, { status: 500 });
  }
}

// GET: Listar historial de muestras
export async function GET(req: Request) {
  try {
    const authResult = await verifyAdmin(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin DB no disponible" }, { status: 500 });
    }

    const snap = await adminDb
      .collection("admin_prospect_demos")
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();

    const demos = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
      };
    });

    return NextResponse.json({ demos });
  } catch (err: any) {
    console.error("[API Admin Muestras GET Error]:", err);
    return NextResponse.json({ error: err.message || "Error al listar muestras" }, { status: 500 });
  }
}

// DELETE: Eliminar una muestra
export async function DELETE(req: Request) {
  try {
    const authResult = await verifyAdmin(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin DB no disponible" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    await adminDb.collection("admin_prospect_demos").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[API Admin Muestras DELETE Error]:", err);
    return NextResponse.json({ error: err.message || "Error al eliminar muestra" }, { status: 500 });
  }
}
