import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../../lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!adminDb) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // Obtener pagos del usuario
    const paymentsSnapshot = await adminDb.collection("payments")
        .where("userId", "==", userId)
        .orderBy("date", "desc")
        .limit(50)
        .get();

    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ payments });

  } catch (error) {
    console.error("User Payments API Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
