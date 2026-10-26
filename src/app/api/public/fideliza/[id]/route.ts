import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase-admin";
import { checkRateLimit } from "../../../../../lib/security";
import { getFreeModel } from "../../../../../lib/gemini-free";
import {
  DEFAULT_FIDELIZACION_CONFIG,
  FidelizacionConfig,
  computeShortMerchantCode,
} from "../../../../../contexts/ProfileContext";
import { sendFidelizaWelcomeEmail } from "../../../../../lib/email-fideliza";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

const EVOLUTION_API_URL = (process.env.EVOLUTION_API_URL || "https://evoapi.grupofugas.cl").trim().replace(/\/$/, "");
const EVOLUTION_API_KEY = (process.env.EVOLUTION_API_KEY || "6833CC358FA4-42E4-8F45-E74D35CC85A7").trim();
const EVOLUTION_INSTANCE = (process.env.EVOLUTION_INSTANCE_NAME || "Santisoft").trim();
const N8N_EVOAPI_WEBHOOK_URL = process.env.N8N_EVOAPI_WEBHOOK_URL || "https://n8n.santisoft.cl/webhook/evoapi";

async function sendWhatsAppNotification(
  phone: string,
  message: string,
  customConfig?: Partial<FidelizacionConfig>
): Promise<{ sent: boolean; error?: string }> {
  if (!phone) return { sent: false, error: "Teléfono vacío" };
  try {
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 9 && cleanPhone.startsWith("9")) {
      cleanPhone = `56${cleanPhone}`;
    } else if (cleanPhone.length === 8) {
      cleanPhone = `569${cleanPhone}`;
    }

    const instanceName = (customConfig?.evolutionInstanceName || EVOLUTION_INSTANCE).trim();
    const apiKey = (customConfig?.evolutionApiKey || EVOLUTION_API_KEY).trim();
    const senderPhone = (customConfig?.whatsappSenderPhone || "").replace(/\D/g, "");

    const url = `${EVOLUTION_API_URL}/message/sendText/${encodeURIComponent(instanceName)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: message,
      }),
    });

    if (res.ok) {
      return { sent: true };
    }

    // Fallback a N8N Webhook si la instancia directa responde error
    if (N8N_EVOAPI_WEBHOOK_URL) {
      const fbRes = await fetch(N8N_EVOAPI_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          number: cleanPhone,
          text: message,
          instanceName,
          senderPhone,
        }),
      });
      if (fbRes.ok) return { sent: true };
    }

    const errTxt = await res.text().catch(() => `HTTP ${res.status}`);
    return { sent: false, error: errTxt.slice(0, 140) };
  } catch (err: any) {
    console.warn("[Fideliza WhatsApp] No se pudo enviar notificación:", err);
    return { sent: false, error: err.message };
  }
}

function parseLoyaltyIdentifier(rawId: string) {
  const decodedId = decodeURIComponent(rawId);
  let uid = decodedId;
  let targetProfileId = "default";
  if (decodedId.includes("___")) {
    const parts = decodedId.split("___");
    uid = parts[0];
    targetProfileId = parts[1] || "default";
  }
  return { uid, targetProfileId, decodedId };
}

async function resolveBusinessAndConfig(rawId: string) {
  let { uid, targetProfileId, decodedId } = parseLoyaltyIdentifier(rawId);
  let userDocRef = adminDb.collection("users").doc(uid);
  let userSnap = await userDocRef.get();

  // Si no es un UID directo, buscar por Código Corto (SP-XXXX), alias personalizado, email o nombre del negocio
  if (!userSnap.exists) {
    const queryClean = decodedId.trim().toUpperCase().replace(/[^A-Z0-9@.]/g, "");
    const queryLower = decodedId.trim().toLowerCase();
    const allUsersSnap = await adminDb.collection("users").get();

    let matchedDoc: any = null;
    let matchedProfileId = "default";

    for (const docSnap of allUsersSnap.docs) {
      const uData = docSnap.data() || {};
      const uProfiles: any[] = Array.isArray(uData.profiles) && uData.profiles.length > 0
        ? uData.profiles
        : [{ id: "default", name: uData.company || uData.name || "" }];

      // Match por email del dueño
      if (uData.email && String(uData.email).toLowerCase() === queryLower) {
        matchedDoc = docSnap;
        matchedProfileId = uProfiles[0]?.id || "default";
        break;
      }

      for (const p of uProfiles) {
        const pid = p.id || "default";
        const shortCode = computeShortMerchantCode(docSnap.id, pid).replace(/[^A-Z0-9]/g, "");
        const customCode = String(p.fidelizacionConfig?.merchantCode || "")
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "");
        const pName = String(p.name || uData.company || "").trim().toLowerCase();

        if (
          (queryClean && (shortCode === queryClean || (customCode && customCode === queryClean))) ||
          (queryLower.length >= 3 && pName === queryLower)
        ) {
          matchedDoc = docSnap;
          matchedProfileId = pid;
          break;
        }
      }
      if (matchedDoc) break;
    }

    if (!matchedDoc) {
      return null;
    }

    userSnap = matchedDoc;
    uid = matchedDoc.id;
    targetProfileId = matchedProfileId;
    decodedId = `${uid}___${targetProfileId}`;
    userDocRef = adminDb.collection("users").doc(uid);
  }

  const userData = userSnap.data() || {};
  const profiles: any[] = userData.profiles || [];
  let profile = profiles.find((p: any) => p.id === targetProfileId) || profiles[0] || {};

  const config: FidelizacionConfig = {
    ...DEFAULT_FIDELIZACION_CONFIG,
    ...(profile.fidelizacionConfig || {}),
    enabled: profile.fidelizacionEnabled === true || profile.fidelizacionConfig?.enabled === true,
  };

  const business = {
    name: profile.name || userData.company || userData.name || "Nuestro Local",
    rubro: profile.rubro || "Comercio & Servicios",
    description: profile.businessDescription || "",
    logoUrl: profile.logoUrl || null,
    phone: config.whatsappSenderPhone || profile.phone || userData.phone || null,
    whatsapp: config.whatsappSenderPhone || profile.phone || userData.phone || null,
    instagramUsername: profile.instagramUsername || profile.instagramUrl || null,
    website: profile.website || null,
    address: profile.address || userData.address || null,
    menuDigitalEnabled: profile.menuDigitalEnabled === true,
  };

  return { uid, targetProfileId, decodedId, business, config, userDocRef };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Identificador no proporcionado" }, { status: 400 });
    }

    const resolved = await resolveBusinessAndConfig(id);
    if (!resolved) {
      return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
    }

    const { uid, targetProfileId, business, config } = resolved;

    // Excluir cashierPin y evolutionApiKey de la respuesta pública por seguridad
    const { cashierPin, evolutionApiKey, ...publicConfig } = config;

    const url = new URL(req.url);
    const phoneParam = url.searchParams.get("phone");
    let memberData = null;
    let transactions: any[] = [];

    if (phoneParam) {
      const cleanPhone = phoneParam.replace(/\D/g, "").slice(-9);
      if (cleanPhone.length >= 8) {
        const memberId = `${uid}_${targetProfileId}_${cleanPhone}`;
        const memberSnap = await adminDb.collection("loyalty_members").doc(memberId).get();
        if (memberSnap.exists) {
          memberData = { id: memberSnap.id, ...memberSnap.data() };
          const txSnap = await adminDb
            .collection("loyalty_transactions")
            .where("memberId", "==", memberId)
            .limit(15)
            .get();
          transactions = txSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        }
      }
    }

    return NextResponse.json({
      success: true,
      enabled: config.enabled,
      business,
      config: publicConfig,
      member: memberData,
      transactions,
    });
  } catch (err: any) {
    console.error("[FIDELIZA GET ERROR]", err);
    return NextResponse.json({ error: "Error al cargar el club de fidelización" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";

    const resolved = await resolveBusinessAndConfig(id);
    if (!resolved) {
      return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
    }

    const { uid, targetProfileId, decodedId, business, config } = resolved;
    const body = await req.json();
    const { action } = body;

    // 1. REGISTRO O INGRESO DE CLIENTE
    if (action === "register_or_login") {
      const { name, phone, email } = body;
      const cleanPhone = (phone || "").replace(/\D/g, "").slice(-9);
      if (cleanPhone.length < 8) {
        return NextResponse.json({ error: "Ingresa un número de teléfono válido (mínimo 8 dígitos)." }, { status: 400 });
      }

      const memberId = `${uid}_${targetProfileId}_${cleanPhone}`;
      const memberRef = adminDb.collection("loyalty_members").doc(memberId);
      const memberSnap = await memberRef.get();

      const nowIso = new Date().toISOString();

      if (memberSnap.exists) {
        const existing = memberSnap.data() || {};
        if (name && name.trim() && !existing.name) {
          await memberRef.update({ name: name.trim(), updatedAt: nowIso });
          existing.name = name.trim();
        }
        return NextResponse.json({
          success: true,
          isNew: false,
          member: { id: memberId, ...existing },
        });
      }

      // Crear nuevo miembro
      const initialStamps = config.welcomeBonus ? 1 : 0;
      const newMember = {
        userId: uid,
        profileId: targetProfileId,
        name: (name || "Cliente VIP").trim(),
        phone: phone.trim(),
        cleanPhone,
        email: (email || "").trim(),
        stamps: initialStamps,
        totalVisits: initialStamps,
        totalSpent: 0,
        rewardsEarned: 0,
        rewardsRedeemed: 0,
        pendingRewards: [] as Array<{ code: string; rewardTitle: string; createdAt: string }>,
        instagramBonusClaimed: false,
        welcomeBonusClaimed: config.welcomeBonus,
        createdAt: nowIso,
        lastVisitAt: nowIso,
      };

      await memberRef.set(newMember);

      if (config.welcomeBonus) {
        await adminDb.collection("loyalty_transactions").add({
          memberId,
          memberName: newMember.name,
          memberPhone: newMember.phone,
          userId: uid,
          profileId: targetProfileId,
          type: "bonus",
          method: "welcome",
          stampsAdded: 1,
          amount: 0,
          note: "Sello de bienvenida por registro",
          status: "approved",
          createdAt: nowIso,
        });
      }

      const cardUrl = `https://fideliza.socialpilot.cl/${decodedId}?phone=${cleanPhone}`;
      
      // Enviar WhatsApp en segundo plano con control de errores para no retrasar el registro
      sendWhatsAppNotification(
        phone,
        `🎉 *¡Bienvenido/a a ${config.programName} de ${business.name}!*\n\nHola ${newMember.name}, tu tarjeta digital ya está activa.${
          config.welcomeBonus ? `\n✨ ¡Te regalamos tu *1er sello de bienvenida*!` : ""
        }\n🎯 Meta: *${config.targetGoal} ${config.mode === "visits" ? "visitas" : "puntos"}* para ganar *${config.rewardTitle}*.\n\n📲 Guarda tu tarjeta aquí:\n${cardUrl}`,
        config
      ).catch((err) => console.warn("[Fideliza WA] Error enviando bienvenida:", err));

      // Si se proporcionó email, enviar correo de bienvenida con enlace a la tarjeta
      if (email && typeof email === "string" && email.includes("@")) {
        sendFidelizaWelcomeEmail({
          toEmail: email.trim(),
          memberName: newMember.name,
          businessName: business.name,
          programName: config.programName,
          cardUrl,
          targetGoal: config.targetGoal,
          rewardTitle: config.rewardTitle,
          mode: config.mode,
          welcomeBonus: !!config.welcomeBonus,
        }).catch((err) => console.warn("[Fideliza Email] Error enviando bienvenida:", err));
      }

      return NextResponse.json({
        success: true,
        isNew: true,
        member: { id: memberId, ...newMember },
      });
    }

    // Helper interno para acreditar sellos/puntos y verificar recompensas
    async function awardStampsToMember(
      memberId: string,
      stampsToAdd: number,
      purchaseAmount: number,
      method: string,
      note: string,
      receiptFolioHash?: string,
      bypassCooldown = false
    ) {
      const memberRef = adminDb.collection("loyalty_members").doc(memberId);
      const memberSnap = await memberRef.get();
      if (!memberSnap.exists) {
        throw new Error("Socio no encontrado.");
      }

      const member = memberSnap.data() || {};
      const now = new Date();
      const nowIso = now.toISOString();

      // Validar regla de máximo 1 visita por día si aplica
      if (config.maxOnePerDay && !bypassCooldown && member.lastStampDate) {
        const todayStr = nowIso.slice(0, 10);
        if (member.lastStampDate === todayStr) {
          throw new Error("Ya sumaste tu visita del día de hoy. ¡Te esperamos mañana para seguir sumando!");
        }
      }

      let currentStamps = (member.stamps || 0) + stampsToAdd;
      let rewardsEarned = member.rewardsEarned || 0;
      const pendingRewards = Array.isArray(member.pendingRewards) ? [...member.pendingRewards] : [];
      let unlockedNewReward = false;
      let latestRewardCode = "";

      const goal = Math.max(1, Number(config.targetGoal) || 4);
      while (currentStamps >= goal) {
        currentStamps -= goal;
        rewardsEarned += 1;
        unlockedNewReward = true;
        latestRewardCode = `VIP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        pendingRewards.push({
          code: latestRewardCode,
          rewardTitle: config.rewardTitle,
          createdAt: nowIso,
        });
      }

      const updatedFields = {
        stamps: currentStamps,
        totalVisits: (member.totalVisits || 0) + 1,
        totalSpent: (member.totalSpent || 0) + (Number(purchaseAmount) || 0),
        rewardsEarned,
        pendingRewards,
        lastVisitAt: nowIso,
        lastStampDate: nowIso.slice(0, 10),
      };

      await memberRef.update(updatedFields);

      await adminDb.collection("loyalty_transactions").add({
        memberId,
        memberName: member.name,
        memberPhone: member.phone,
        userId: uid,
        profileId: targetProfileId,
        type: "visit",
        method,
        stampsAdded: stampsToAdd,
        amount: Number(purchaseAmount) || 0,
        note,
        ...(receiptFolioHash ? { receiptFolioHash } : {}),
        status: "approved",
        createdAt: nowIso,
      });

      const cardUrl = `https://fideliza.socialpilot.cl/${decodedId}?phone=${member.cleanPhone || ""}`;
      if (unlockedNewReward) {
        await sendWhatsAppNotification(
          member.phone,
          `🎁 *¡FELICITACIONES ${member.name.toUpperCase()}!*\n\nCompletaste tu meta en *${business.name}* y desbloqueaste tu premio:\n🏆 *${config.rewardTitle}*\n\n🔐 Tu código de canje es: *${latestRewardCode}*\nMuéstralo en caja en tu próxima compra.\n\n📲 Ver mi tarjeta: ${cardUrl}`,
          config
        );
      } else {
        await sendWhatsAppNotification(
          member.phone,
          `✅ *¡Sello acreditado en ${business.name}!*\n\nSumaste +${stampsToAdd} ${
            config.mode === "visits" ? "visita" : "punto(s)"
          }.\n📊 Tu progreso actual: *${currentStamps} de ${goal}* para tu *${config.rewardTitle}*.\n\n📲 Ver mi tarjeta: ${cardUrl}`,
          config
        );
      }

      return {
        member: { id: memberId, ...member, ...updatedFields },
        unlockedNewReward,
        latestRewardCode,
      };
    }

    // 2. VALIDACIÓN POR PIN DE CAJA
    if (action === "validate_pin") {
      const { allowed } = checkRateLimit(`fideliza_pin_${ip}`, 8, 60_000);
      if (!allowed) {
        return NextResponse.json(
          { error: "Demasiados intentos de PIN. Espera 1 minuto." },
          { status: 429 }
        );
      }

      const { memberId, pin, purchaseAmount = 0, bypassCooldown = false } = body;
      if (!pin || String(pin).trim() !== String(config.cashierPin).trim()) {
        return NextResponse.json(
          { error: "PIN de cajero incorrecto. Solicita validación al personal del local." },
          { status: 403 }
        );
      }

      if (config.minPurchaseAmount && Number(purchaseAmount) > 0 && Number(purchaseAmount) < config.minPurchaseAmount) {
        return NextResponse.json(
          { error: `El consumo mínimo para sumar es de $${config.minPurchaseAmount.toLocaleString("es-CL")}.` },
          { status: 400 }
        );
      }

      let stampsToAdd = 1;
      if (config.mode === "amount" && Number(purchaseAmount) > 0) {
        stampsToAdd = Math.max(1, Math.floor(Number(purchaseAmount) / (config.amountPerPoint || 1000)));
      }

      try {
        const result = await awardStampsToMember(
          memberId,
          stampsToAdd,
          Number(purchaseAmount) || 0,
          "pin",
          "Validado con PIN en mostrador",
          undefined,
          Boolean(bypassCooldown)
        );
        return NextResponse.json({ success: true, ...result });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
    }

    // 3. VALIDACIÓN INTELIGENTE DE BOLETA / VOUCHER CON AGENTES DE VISIÓN
    if (action === "validate_receipt") {
      const { allowed } = checkRateLimit(`fideliza_ocr_${ip}`, 5, 60_000);
      if (!allowed) {
        return NextResponse.json(
          { error: "Has superado el límite de lecturas por minuto. Intenta en un momento." },
          { status: 429 }
        );
      }

      if (!config.allowReceiptOcr) {
        return NextResponse.json(
          { error: "La validación por foto de boleta no está habilitada en este comercio." },
          { status: 400 }
        );
      }

      const { memberId, imageBase64 } = body;
      if (!memberId || !imageBase64) {
        return NextResponse.json({ error: "Falta la imagen de la boleta o comprobante." }, { status: 400 });
      }

      const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

      const model = getFreeModel("gemini-2.5-flash");
      const todayChile = new Date().toLocaleDateString("es-CL");

      const prompt = `
Analiza esta foto de una boleta electrónica, ticket de caja, voucher de tarjeta (Transbank/Getnet/MercadoPago) o comprobante de pago.
Comercio esperado: "${business.name}" (Rubro: ${business.rubro}). Fecha actual referencial: ${todayChile}.

Extrae los datos y devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:
{
  "isReceipt": true/false,
  "folioOrAuthCode": "número de boleta, folio o código de autorización único (string vacío si no es legible)",
  "totalAmount": número entero con el monto total pagado en pesos (ej: 12500),
  "dateDetected": "fecha impresa en la boleta",
  "merchantDetected": "nombre del comercio en la boleta",
  "isValid": true/false,
  "rejectionReason": "explicación breve en español si no es una boleta real o si es ilegible"
}
`;

      let ocrResult: any = null;
      try {
        const aiRes = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Clean,
              mimeType,
            },
          },
        ]);
        const rawText = aiRes.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        ocrResult = JSON.parse(rawText);
      } catch (err) {
        console.error("[Fideliza OCR Error]", err);
        return NextResponse.json(
          { error: "No pudimos leer la foto con claridad. Asegúrate de que la boleta esté bien iluminada y enfocada." },
          { status: 400 }
        );
      }

      if (!ocrResult?.isReceipt || !ocrResult?.isValid) {
        return NextResponse.json(
          {
            error:
              ocrResult?.rejectionReason ||
              "La imagen subida no parece ser una boleta o comprobante de compra válido.",
          },
          { status: 400 }
        );
      }

      const detectedAmount = Number(ocrResult.totalAmount) || 0;
      if (config.minPurchaseAmount && detectedAmount < config.minPurchaseAmount) {
        return NextResponse.json(
          {
            error: `La boleta detectada es por $${detectedAmount.toLocaleString(
              "es-CL"
            )}, y el monto mínimo para sumar es $${config.minPurchaseAmount.toLocaleString("es-CL")}.`,
          },
          { status: 400 }
        );
      }

      const folioRaw = `${ocrResult.folioOrAuthCode || "sin_folio"}_${detectedAmount}_${ocrResult.dateDetected || ""}`;
      const receiptFolioHash = crypto
        .createHash("sha256")
        .update(`${uid}_${folioRaw}`)
        .digest("hex")
        .slice(0, 24);

      // Verificar que esta boleta no haya sido usada antes
      const dupSnap = await adminDb
        .collection("loyalty_transactions")
        .where("receiptFolioHash", "==", receiptFolioHash)
        .limit(1)
        .get();

      if (!dupSnap.empty) {
        return NextResponse.json(
          { error: "⚠️ Este comprobante o boleta ya fue registrado anteriormente." },
          { status: 400 }
        );
      }

      let stampsToAdd = 1;
      if (config.mode === "amount" && detectedAmount > 0) {
        stampsToAdd = Math.max(1, Math.floor(detectedAmount / (config.amountPerPoint || 1000)));
      }

      try {
        const result = await awardStampsToMember(
          memberId,
          stampsToAdd,
          detectedAmount,
          "receipt_ocr",
          `Boleta validada (#${ocrResult.folioOrAuthCode || "OK"} · $${detectedAmount.toLocaleString("es-CL")})`,
          receiptFolioHash
        );
        return NextResponse.json({
          success: true,
          ocrDetails: ocrResult,
          ...result,
        });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
    }

    // 4. BONO POR SEGUIR EN INSTAGRAM
    if (action === "claim_instagram_bonus") {
      const { memberId } = body;
      if (!config.instagramBonus) {
        return NextResponse.json({ error: "Bono de Instagram no disponible." }, { status: 400 });
      }
      const memberRef = adminDb.collection("loyalty_members").doc(memberId);
      const memberSnap = await memberRef.get();
      if (!memberSnap.exists) {
        return NextResponse.json({ error: "Socio no encontrado." }, { status: 404 });
      }
      const member = memberSnap.data() || {};
      if (member.instagramBonusClaimed) {
        return NextResponse.json({ error: "Ya reclamaste tu sello de regalo por Instagram." }, { status: 400 });
      }

      await memberRef.update({ instagramBonusClaimed: true });
      const result = await awardStampsToMember(
        memberId,
        1,
        0,
        "instagram_bonus",
        "Bono por seguir en Instagram",
        undefined,
        true
      );
      return NextResponse.json({ success: true, ...result });
    }

    // 5. CANJEAR PREMIO EN CAJA
    if (action === "cashier_redeem_reward") {
      const { memberId, pin, rewardCode } = body;
      if (!pin || String(pin).trim() !== String(config.cashierPin).trim()) {
        return NextResponse.json({ error: "PIN de cajero inválido." }, { status: 403 });
      }

      const memberRef = adminDb.collection("loyalty_members").doc(memberId);
      const memberSnap = await memberRef.get();
      if (!memberSnap.exists) {
        return NextResponse.json({ error: "Socio no encontrado." }, { status: 404 });
      }

      const member = memberSnap.data() || {};
      const pendingRewards: any[] = Array.isArray(member.pendingRewards) ? member.pendingRewards : [];
      const rewardIdx = pendingRewards.findIndex(
        (r) => r.code.toUpperCase() === String(rewardCode || "").trim().toUpperCase()
      );

      if (rewardIdx === -1) {
        return NextResponse.json({ error: "Código de premio no encontrado o ya fue canjeado." }, { status: 400 });
      }

      const redeemedItem = pendingRewards[rewardIdx];
      pendingRewards.splice(rewardIdx, 1);

      const nowIso = new Date().toISOString();
      await memberRef.update({
        pendingRewards,
        rewardsRedeemed: (member.rewardsRedeemed || 0) + 1,
        updatedAt: nowIso,
      });

      await adminDb.collection("loyalty_transactions").add({
        memberId,
        memberName: member.name,
        memberPhone: member.phone,
        userId: uid,
        profileId: targetProfileId,
        type: "redeem",
        method: "cashier_pin",
        stampsAdded: 0,
        amount: 0,
        note: `Premio canjeado: ${redeemedItem.rewardTitle} (${redeemedItem.code})`,
        status: "approved",
        createdAt: nowIso,
      });

      await sendWhatsAppNotification(
        member.phone,
        `🥳 *¡Premio Canjeado con Éxito!*\n\nHola ${member.name}, acabas de canjear tu *${redeemedItem.rewardTitle}* (Código ${redeemedItem.code}) en *${business.name}*.\n\n¡Gracias por preferirnos! Sigue sumando visitas en tu tarjeta digital.`,
        config
      );

      return NextResponse.json({
        success: true,
        redeemed: redeemedItem,
        member: {
          id: memberId,
          ...member,
          pendingRewards,
          rewardsRedeemed: (member.rewardsRedeemed || 0) + 1,
        },
      });
    }

    // 6. TERMINAL DE CAJA: LISTAR Y BUSCAR CLIENTES CON PIN DE CAJERO
    if (action === "cashier_list_members") {
      const { allowed } = checkRateLimit(`fideliza_cashier_${ip}`, 15, 60_000);
      if (!allowed) {
        return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });
      }

      const { pin } = body;
      if (!pin || String(pin).trim() !== String(config.cashierPin).trim()) {
        return NextResponse.json({ error: "PIN de cajero incorrecto." }, { status: 403 });
      }

      const membersSnap = await adminDb
        .collection("loyalty_members")
        .where("userId", "==", uid)
        .get();

      const members = membersSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m: any) => (m.profileId || "default") === targetProfileId)
        .sort((a: any, b: any) => (b.lastVisitAt || "").localeCompare(a.lastVisitAt || ""));

      return NextResponse.json({
        success: true,
        business,
        config: { ...config, cashierPin: undefined, evolutionApiKey: undefined },
        members,
      });
    }

    // 7. PROBAR CONEXIÓN WHATSAPP (EVOLUTION API) DESDE EL PANEL
    if (action === "test_whatsapp") {
      const { pin, testPhone, whatsappSenderPhone, evolutionInstanceName, evolutionApiKey } = body;
      if (!pin || String(pin).trim() !== String(config.cashierPin).trim()) {
        return NextResponse.json({ error: "PIN inválido." }, { status: 403 });
      }
      const targetPhone = testPhone || whatsappSenderPhone || config.whatsappSenderPhone;
      if (!targetPhone) {
        return NextResponse.json(
          { error: "Ingresa un número de teléfono para enviar la prueba." },
          { status: 400 }
        );
      }

      const result = await sendWhatsAppNotification(
        targetPhone,
        `✅ *Prueba de Conexión Fideliza*\n\nEl canal de WhatsApp de *${business.name}* (${config.programName}) está correctamente conectado a Evolution API y listo para enviar sellos y premios a tus clientes.`,
        {
          whatsappSenderPhone: whatsappSenderPhone || config.whatsappSenderPhone,
          evolutionInstanceName: evolutionInstanceName || config.evolutionInstanceName,
          evolutionApiKey: evolutionApiKey || config.evolutionApiKey,
        }
      );

      if (!result.sent) {
        return NextResponse.json(
          { error: `No se pudo entregar el mensaje por Evolution API: ${result.error || "Verifica la instancia"}` },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (err: any) {
    console.error("[FIDELIZA POST ERROR]", err);
    return NextResponse.json({ error: err.message || "Error al procesar solicitud" }, { status: 500 });
  }
}
