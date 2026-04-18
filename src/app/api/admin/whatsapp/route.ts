import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "No token" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        // Check role in Firestore
        const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
        const userData = userDoc.data();
        const isSuperAdmin = decodedToken.email === "diemoroy@gmail.com";
        const isAdmin = userData?.role === "admin";

        if (!isSuperAdmin && !isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (!adminDb) throw new Error("Firebase Admin DB not initialized");

        // Fetch all chat sessions ordered by recently updated
        const snapshot = await adminDb.collection("whatsapp_chats")
            .orderBy("updatedAt", "desc")
            .get();

        const chats = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            chats.push({
                phone: doc.id,
                pushName: data.lastPushName || "Desconocido",
                updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
            });
        }

        return NextResponse.json({ chats }, { status: 200 });

    } catch (error: any) {
        console.error("Admin WhatsApp API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
