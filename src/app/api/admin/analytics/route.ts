import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";

export async function GET() {
    try {
        if (!adminDb) {
            return NextResponse.json({ error: "DB not initialized" }, { status: 500 });
        }

        const today = new Date().toISOString().split("T")[0];

        // 1. Fetch all events (last 500)
        const snap = await adminDb.collection("analytics_events")
            .orderBy("createdAt", "desc")
            .limit(500)
            .get();

        const events: any[] = [];
        snap.forEach(doc => events.push(doc.data()));

        // 2. KPI counters
        const landing_views = events.filter(e => e.page === "landing").length;
        const panel_views = events.filter(e => e.page === "panel").length;
        const demo_requests = events.filter(e => e.event === "demo_request").length;
        const todayEvents = events.filter(e => e.date === today).length;

        // 3. Daily aggregation
        const dailyMap: Record<string, number> = {};
        events.forEach(e => {
            if (!e.date) return;
            dailyMap[e.date] = (dailyMap[e.date] || 0) + 1;
        });
        const daily = Object.entries(dailyMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30);

        // 4. By page breakdown
        const pageMap: Record<string, number> = {};
        events.forEach(e => {
            const key = `${e.event}__${e.page}`;
            pageMap[key] = (pageMap[key] || 0) + 1;
        });
        const by_page = Object.entries(pageMap)
            .map(([key, count]) => {
                const [event, page] = key.split("__");
                return { event, page, count };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 5. By device
        const deviceMap: Record<string, number> = {};
        events.forEach(e => {
            if (!e.device) return;
            deviceMap[e.device] = (deviceMap[e.device] || 0) + 1;
        });
        const by_device = Object.entries(deviceMap)
            .map(([device, count]) => ({ device, count }))
            .sort((a, b) => b.count - a.count);

        // 6. Recent events (last 20)
        const recent = events.slice(0, 20);

        return NextResponse.json({
            landing_views,
            panel_views,
            demo_requests,
            today: todayEvents,
            daily,
            by_page,
            by_device,
            recent,
        });
    } catch (error: any) {
        console.error("[ANALYTICS API]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
