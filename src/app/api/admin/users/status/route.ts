import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../../lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin not configured" }, { status: 500 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check role in Firestore
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();
    const isSuperAdmin = decodedToken.email === "diemoroy@gmail.com";
    const isAdmin = userData?.role === "admin";

    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { userId, isDisabled } = await req.json();

    if (!userId) {
       return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Update in Firestore
    await adminDb.collection("users").doc(userId).update({
        isDisabled: isDisabled
    });

    // Also disable in Firebase Auth so they can't even get a token next time
    await adminAuth.updateUser(userId, { disabled: isDisabled });

    return NextResponse.json({ success: true, isDisabled }, { status: 200 });

  } catch (error) {
    console.error("Admin Status POST Error:", error);
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
  }
}
