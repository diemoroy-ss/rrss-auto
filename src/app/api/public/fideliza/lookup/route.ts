import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase-admin";
import { checkRateLimit } from "../../../../../lib/security";
import { computeShortMerchantCode } from "../../../../../contexts/ProfileContext";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const { allowed } = checkRateLimit(`fideliza_lookup_${ip}`, 30, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiadas consultas. Por favor intenta en unos momentos." },
        { status: 429 }
      );
    }

    const phoneParam = req.nextUrl.searchParams.get("phone") || "";
    const rawDigits = phoneParam.replace(/\D/g, "");
    if (!rawDigits || rawDigits.length < 8) {
      return NextResponse.json(
        { error: "Ingresa un número de teléfono válido (mínimo 8 dígitos)." },
        { status: 400 }
      );
    }

    // Preparar variaciones posibles del teléfono para asegurar coincidencia exacta
    const nineDigits = rawDigits.slice(-9);
    const with56 = `56${nineDigits}`;
    const candidates = Array.from(
      new Set([nineDigits, with56, rawDigits, phoneParam.trim(), `+${with56}`])
    ).filter(Boolean);

    // 1. Buscar en loyalty_members por cleanPhone
    const snapClean = await adminDb
      .collection("loyalty_members")
      .where("cleanPhone", "in", candidates.slice(0, 10))
      .get();

    // 2. Si no encontró o para complementar, buscar también por phone
    let docList = [...snapClean.docs];
    if (docList.length === 0) {
      const snapPhone = await adminDb
        .collection("loyalty_members")
        .where("phone", "in", candidates.slice(0, 10))
        .get();
      docList = [...snapPhone.docs];
    }

    // Eliminar posibles duplicados por ID de documento
    const uniqueDocs = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    for (const d of docList) {
      uniqueDocs.set(d.id, d);
    }

    if (uniqueDocs.size === 0) {
      return NextResponse.json({ success: true, phone: nineDigits, cards: [] });
    }

    const cards: any[] = [];
    for (const docSnap of uniqueDocs.values()) {
      const m = docSnap.data();
      const uid = m.userId;
      const profileId = m.profileId || "default";
      if (!uid) continue;

      const userSnap = await adminDb.collection("users").doc(uid).get();
      if (!userSnap.exists) continue;
      const userData = userSnap.data() || {};
      const profiles: any[] = userData.profiles || [];
      const profile = profiles.find((p: any) => p.id === profileId) || profiles[0] || {};

      const config = profile.fidelizacionConfig || {};
      const shortMerchantCode = config.merchantCode || computeShortMerchantCode(uid, profileId);
      const friendlyClubId = shortMerchantCode || `${uid}___${profileId}`;

      const currentStamps = Number(m.stamps ?? m.currentStamps ?? 0);
      const targetGoal = Number(config.targetGoal || 5);
      const pendingRewards = Array.isArray(m.pendingRewards) ? m.pendingRewards : [];

      cards.push({
        memberId: docSnap.id,
        clubId: friendlyClubId,
        merchantCode: shortMerchantCode,
        businessName: profile.name || userData.company || userData.name || "Comercio Asociado",
        rubro: profile.rubro || "Comercio",
        logoUrl: profile.logoUrl || null,
        programName: config.programName || "Club VIP",
        rewardTitle: config.rewardTitle || "Premio Exclusivo",
        targetGoal,
        currentStamps,
        stampsRemaining: Math.max(0, targetGoal - currentStamps),
        progressPercent: Math.min(100, Math.round((currentStamps / Math.max(1, targetGoal)) * 100)),
        totalVisits: Number(m.totalVisits ?? currentStamps),
        rewardsEarned: Number(m.rewardsEarned ?? 0),
        rewardsRedeemed: Number(m.rewardsRedeemed ?? 0),
        pendingRewards,
        pendingRewardsCount: pendingRewards.length,
        hasRewardReady: pendingRewards.length > 0 || currentStamps >= targetGoal,
        stampIcon: config.stampIcon || "⭐",
        cleanPhone: m.cleanPhone || nineDigits,
        lastVisitAt: m.lastVisitAt || m.updatedAt || m.createdAt || null,
        cardUrl: `https://fideliza.socialpilot.cl/${friendlyClubId}?phone=${m.cleanPhone || nineDigits}`,
      });
    }

    // Ordenar: primero los comercios que tienen premios listos para canjear, luego los de mayor avance
    cards.sort((a, b) => {
      if (a.hasRewardReady && !b.hasRewardReady) return -1;
      if (!a.hasRewardReady && b.hasRewardReady) return 1;
      return b.currentStamps - a.currentStamps;
    });

    return NextResponse.json({
      success: true,
      phone: nineDigits,
      totalCards: cards.length,
      cards,
    });
  } catch (err: any) {
    console.error("[FIDELIZA LOOKUP ERROR]", err);
    return NextResponse.json(
      { error: "Error al buscar tus tarjetas de fidelización." },
      { status: 500 }
    );
  }
}
