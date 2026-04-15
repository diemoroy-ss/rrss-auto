import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../../lib/firebase-admin";

export async function GET(req: Request, { params }: { params: { phone: string } }) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "No token" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        if (decodedToken.email !== "diemoroy@gmail.com") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (!adminDb) throw new Error("Firebase Admin DB not initialized");

        const phone = params.phone;

        // Fetch messages for the specific phone number, most recent first, limit 50
        const snapshot = await adminDb.collection("whatsapp_chats")
            .doc(phone)
            .collection("messages")
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        const messages = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            messages.unshift({
                id: doc.id,
                role: data.role,
                text: data.text,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
            });
        }

        return NextResponse.json({ messages }, { status: 200 });

    } catch (error: any) {
        console.error("Admin WhatsApp Phone API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
