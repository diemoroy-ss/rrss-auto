import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase-admin";
import { checkRateLimit, getClientIp } from "../../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 9 && digits.startsWith("9")) return `56${digits}`;
  if (digits.length === 8) return `569${digits}`;
  return digits;
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed } = checkRateLimit(`fideliza_lookup_${ip}`, 15, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiadas consultas. Intenta en un minuto." },
        { status: 429 }
      );
    }

    const phoneParam = req.nextUrl.searchParams.get("phone") || "";
    const cleanPhone = normalizePhone(phoneParam);
    if (!cleanPhone || cleanPhone.length < 9) {
      return NextResponse.json(
        { error: "Ingresa un número de WhatsApp válido." },
        { status: 400 }
      );
    }

    const snap = await adminDb
      .collection("loyalty_members")
      .where("cleanPhone", "==", cleanPhone)
      .get();

    if (snap.empty) {
      return NextResponse.json({ success: true, cards: [] });
    }

    const cards: any[] = [];
    for (const docSnap of snap.docs) {
      const m = docSnap.data();
      const uid = m.userId;
      const profileId = m.profileId || "default";
      if (!uid) continue;

      const userSnap = await adminDb.collection("users").doc(uid).get();
      if (!userSnap.exists) continue;
      const userData = userSnap.data() || {};
      const profiles: any[] = userData.profiles || [];
      const profile = profiles.find((p: any) => p.id === profileId) || profiles[0] || {};

      const clubId = `${uid}___${profileId}`;
      const config = profile.fidelizacionConfig || {};

      cards.push({
        memberId: docSnap.id,
        clubId,
        businessName: profile.name || userData.company || userData.name || "Comercio Asociado",
        rubro: profile.rubro || "Comercio",
        logoUrl: profile.logoUrl || null,
        programName: config.programName || "Club VIP",
        rewardTitle: config.rewardTitle || "Premio Exclusivo",
        targetGoal: config.targetGoal || 5,
        stampIcon: config.stampIcon || "⭐",
        currentStamps: m.currentStamps || 0,
        pendingRewardsCount: Array.isArray(m.pendingRewards) ? m.pendingRewards.length : 0,
        cleanPhone,
      });
    }

    return NextResponse.json({ success: true, cards });
  } catch (err: any) {
    console.error("[FIDELIZA LOOKUP ERROR]", err);
    return NextResponse.json(
      { error: "Error al buscar tus tarjetas." },
      { status: 500 }
    );
  }
}
