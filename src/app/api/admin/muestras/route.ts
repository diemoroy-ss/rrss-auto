import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com", "admin@santisoft.cl"];

async function verifyUserAccess(req: Request) {
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
    return { uid: decoded.uid, email, role: "admin", isSuperAdmin: true, sellerName: "Admin" };
  }
  // Check role in users collection
  const userDoc = await adminDb!.collection("users").doc(decoded.uid).get();
  const userData = userDoc.data();
  const role = userData?.role;
  if (role === "admin" || role === "vendedor") {
    return { 
      uid: decoded.uid, 
      email, 
      role, 
      isSuperAdmin: role === "admin", 
      sellerName: userData?.name || email 
    };
  }
  return { error: "Unauthorized", status: 403 };
}

// POST: Crear o actualizar una muestra para prospecto
export async function POST(req: Request) {
  try {
    const authResult = await verifyUserAccess(req);
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
      // Actualizar existente (verificar si el vendedor es dueño o admin)
      const existingDoc = await adminDb.collection("admin_prospect_demos").doc(id).get();
      if (existingDoc.exists) {
        const existingData = existingDoc.data();
        if (authResult.role === "vendedor" && existingData?.createdBy && existingData.createdBy !== authResult.uid) {
          return NextResponse.json({ error: "No tienes permiso para modificar esta muestra" }, { status: 403 });
        }
      }

      await adminDb.collection("admin_prospect_demos").doc(id).set(
        {
          ...data,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      return NextResponse.json({ success: true, demoId: id, publicDemoUrl: `${baseUrl}/m/${id}` });
    } else {
      // Crear nueva muestra vinculada al vendedor
      const docRef = await adminDb.collection("admin_prospect_demos").add({
        ...data,
        createdBy: authResult.uid,
        sellerEmail: authResult.email,
        sellerName: authResult.sellerName || authResult.email,
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

// GET: Listar historial de muestras (filtrado por vendedor si aplica)
export async function GET(req: Request) {
  try {
    const authResult = await verifyUserAccess(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin DB no disponible" }, { status: 500 });
    }

    let snap;
    if (authResult.role === "vendedor") {
      // El vendedor solo ve su propio historial
      snap = await adminDb.collection("admin_prospect_demos")
        .where("createdBy", "==", authResult.uid)
        .get();
    } else {
      // Administrador ve todas las muestras
      snap = await adminDb.collection("admin_prospect_demos").get();
    }

    const demos = snap.docs.map((d) => {
      const data = d.data();
      let isoDate: string | null = null;
      let timestampMs = 0;

      if (data.createdAt?.toDate) {
        const dObj = data.createdAt.toDate();
        isoDate = dObj.toISOString();
        timestampMs = dObj.getTime();
      } else if (data.createdAt instanceof Date) {
        isoDate = data.createdAt.toISOString();
        timestampMs = data.createdAt.getTime();
      } else if (typeof data.createdAt === "string") {
        isoDate = data.createdAt;
        timestampMs = new Date(data.createdAt).getTime() || 0;
      }

      return {
        id: d.id,
        ...data,
        createdAt: isoDate,
        _sortTime: timestampMs,
      };
    });

    demos.sort((a, b) => b._sortTime - a._sortTime);

    return NextResponse.json({ demos });
  } catch (err: any) {
    console.error("[API Admin Muestras GET Error]:", err);
    return NextResponse.json({ error: err.message || "Error al listar muestras", demos: [] }, { status: 500 });
  }
}

// DELETE: Eliminar una muestra
export async function DELETE(req: Request) {
  try {
    const authResult = await verifyUserAccess(req);
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

    // Verificar si el vendedor es dueño
    const demoDoc = await adminDb.collection("admin_prospect_demos").doc(id).get();
    if (demoDoc.exists) {
      const demoData = demoDoc.data();
      if (authResult.role === "vendedor" && demoData?.createdBy && demoData.createdBy !== authResult.uid) {
        return NextResponse.json({ error: "No tienes permiso para eliminar esta muestra" }, { status: 403 });
      }
    }

    await adminDb.collection("admin_prospect_demos").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[API Admin Muestras DELETE Error]:", err);
    return NextResponse.json({ error: err.message || "Error al eliminar muestra" }, { status: 500 });
  }
}
