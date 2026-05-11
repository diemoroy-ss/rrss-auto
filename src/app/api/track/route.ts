import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase-admin";
import { headers } from "next/headers";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { event, page, userId } = body;

        if (!event || !page) {
            return NextResponse.json({ error: "Missing event or page" }, { status: 400 });
        }

        const headersList = headers();
        const userAgent = headersList.get("user-agent") || "unknown";
        const referer = headersList.get("referer") || "direct";

        // Simple device detection from UA
        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
        const device = isMobile ? "mobile" : "desktop";

        const today = new Date().toISOString().split("T")[0]; // "2026-05-10"
        const month = today.slice(0, 7); // "2026-05"

        if (!adminDb) {
            return NextResponse.json({ ok: false });
        }

        // Store individual event
        await adminDb.collection("analytics_events").add({
            event,
            page,
            userId: userId || null,
            device,
            userAgent,
            referer,
            createdAt: new Date().toISOString(),
            date: today,
            month,
        });

        // Increment daily counter using merge
        const dailyRef = adminDb.collection("analytics_daily").doc(`${today}_${event}_${page.replace(/\//g, "_")}`);
        await dailyRef.set({
            date: today,
            month,
            event,
            page,
            count: adminDb.constructor.name ? 1 : 1, // placeholder
        }, { merge: true });

        // Actually increment with FieldValue
        const { FieldValue } = await import("firebase-admin/firestore");
        await dailyRef.update({ count: FieldValue.increment(1) });

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("[TRACK]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
