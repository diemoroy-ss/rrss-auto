import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    const snapshot = await adminDb.collection("bookings").orderBy("createdAt", "desc").get();
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    console.error("Error fetching admin bookings:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { date, time, reason } = await req.json();

    if (!date || !time) {
      return NextResponse.json({ error: "Date and time are required" }, { status: 400 });
    }

    const docRef = await adminDb.collection("bookings").add({
      name: "BLOQUEADO",
      email: "admin@santisoft.cl",
      phone: "",
      date,
      time,
      notes: reason || "Horario bloqueado por Administrador",
      status: "blocked",
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error("Error creating block:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, date, time, status } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (date) updateData.date = date;
    if (time) updateData.time = time;
    if (status) updateData.status = status;
    updateData.updatedAt = new Date().toISOString();

    await adminDb.collection("bookings").doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await adminDb.collection("bookings").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
