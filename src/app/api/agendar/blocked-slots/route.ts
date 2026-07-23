import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ occupiedSlots: [] });
    }

    // Consultar reservas no canceladas para esta fecha
    const snapshot = await adminDb.collection("bookings")
      .where("date", "==", date)
      .get();

    const occupiedSlots = snapshot.docs
      .map(doc => doc.data())
      .filter(data => data.status !== "cancelled")
      .map(data => data.time);

    return NextResponse.json({ success: true, date, occupiedSlots });
  } catch (error: any) {
    console.error("Error fetching blocked slots:", error);
    return NextResponse.json({ occupiedSlots: [] });
  }
}
