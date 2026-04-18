import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

export async function GET(req: Request) {
  try {
    // Basic API Key or Header validation could be added, 
    // but the actual security check is verifying the caller's identity.
    // In a stateless Next.js API route without session cookies, 
    // it's best to pass the user's ID token and verify it via adminAuth.
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: "Error 500: Firebase Admin No Configurado. Falta la variable FIREBASE_SERVICE_ACCOUNT en el servidor." }, { status: 500 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check role in Firestore
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();
    const userEmail = (decodedToken.email || "").toLowerCase();
    const isSuperAdmin = userEmail === "diemoroy@gmail.com" || userEmail === "admin@santisoft.cl";
    const isAdmin = userData?.role === "admin";

    if (!isSuperAdmin && !isAdmin) {
      console.warn(`[ADMIN API] Unauthorized access denied for ${userEmail}`);
      return NextResponse.json({ 
        error: "Acceso Prohibido: No eres administrador",
        debugEmail: userEmail,
        debugRole: userData?.role || "none"
      }, { status: 403 });
    }

    // List users from Firestore (not just Auth, because we want their plans)
    const usersSnapshot = await adminDb.collection("users").get();
    
    // Calculate first day of the month for the quota counts
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    // Fetch all posts this month in one query to avoid N+1 queries and composite index requirements
    const allPostsThisMonth = await adminDb.collection("social_posts")
      .where("createdAt", ">=", firstDayOfMonth)
      .get();
      
    const userPostCounts: Record<string, number> = {};
    for (const post of allPostsThisMonth.docs) {
      const postUserId = post.data().userId;
      if (postUserId) {
        userPostCounts[postUserId] = (userPostCounts[postUserId] || 0) + 1;
      }
    }

    const usersData = usersSnapshot.docs.map(userDoc => {
      const data = userDoc.data();
      const uId = userDoc.id;
      return {
        id: uId,
        email: data.email || "No Email",
        name: data.name || "Sin Nombre",
        plan: data.plan || "free",
        role: data.role || "user",
        isDisabled: data.isDisabled || false,
        registeredApps: data.registeredApps || [],
        postsThisMonth: userPostCounts[uId] || 0
      };
    });

    return NextResponse.json({ users: usersData }, { status: 200 });

  } catch (error) {
    console.error("Admin Users GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
