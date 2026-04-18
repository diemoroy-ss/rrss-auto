import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";
import { auth } from "firebase-admin";

export async function GET(req: Request) {
  try {
    // Verificar que sea admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await auth().verifyIdToken(idToken);
    
    // Check role in Firestore
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();
    const isSuperAdmin = decodedToken.email === "diemoroy@gmail.com";
    const isAdmin = userData?.role === "admin";

    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // Obtener todos los pagos ordenados por fecha descendente
    const paymentsSnapshot = await adminDb.collection("payments").orderBy("date", "desc").limit(100).get();
    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Obtener información básica de usuarios para cruzar emails (opcional pero útil)
    const userIds = Array.from(new Set(payments.map((p: any) => p.userId)));
    const usersMap: { [key: string]: string } = {};
    
    if (userIds.length > 0) {
        const usersSnapshot = await adminDb.collection("users").where("__name__", "in", userIds.slice(0, 30)).get();
        usersSnapshot.forEach(u => {
            usersMap[u.id] = u.data().email || u.data().name || "Usuario Desconocido";
        });
    }

    const detailedPayments = payments.map((p: any) => ({
        ...p,
        userIdentifier: usersMap[p.userId] || p.userId
    }));

    return NextResponse.json({ payments: detailedPayments });

  } catch (error) {
    console.error("Admin Payments API Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
