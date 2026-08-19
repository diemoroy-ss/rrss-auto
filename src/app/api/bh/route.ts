import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initializeApp as initAdminApp, getApps, cert } from "firebase-admin/app";
import {
  generateReelScript,
  generateStorySequence,
  generateReelCalendar,
  runAntiBanAudit,
  runAdSpy,
  generateAdCopy,
  type ReelScriptInput,
  type StorySequenceInput,
  type CalendarInput,
  type AntiBanAuditInput,
  type AdSpyInput,
  type AdCopyInput,
} from "../../../lib/bh-skills";

// ─────────────────────────────────────────────
// Tipos de la request
// ─────────────────────────────────────────────

type BhAction =
  | "reel-script"
  | "stories"
  | "calendar"
  | "anti-ban-audit"
  | "ad-spy"
  | "ad-copy";

interface BhRequest {
  action: BhAction;
  // Payload varía por action — se tipea más abajo
  [key: string]: unknown;
}

// ─────────────────────────────────────────────
// Inicialización Firebase Admin (lazy)
// ─────────────────────────────────────────────

function ensureAdminApp() {
  if (getApps().length === 0) {
    initAdminApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
}

// ─────────────────────────────────────────────
// Validación de sesión
// ─────────────────────────────────────────────

async function validateSession(request: NextRequest): Promise<string | null> {
  try {
    ensureAdminApp();
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);
    const decoded = await getAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// POST /api/bh
// ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Validar autenticación
  const uid = await validateSession(request);
  if (!uid) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: BhRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido en el body" }, { status: 400 });
  }

  const { action } = body;

  if (!action) {
    return NextResponse.json({ error: "El campo 'action' es requerido" }, { status: 400 });
  }

  try {
    switch (action) {
      // ─── GUIÓN DE REEL ───────────────────────
      case "reel-script": {
        const input: ReelScriptInput = {
          topic: String(body.topic ?? ""),
          niche: (body.niche as ReelScriptInput["niche"]) ?? "general",
          objective: (body.objective as ReelScriptInput["objective"]) ?? "educacion",
          tone: body.tone as ReelScriptInput["tone"],
          durationSeconds: (body.durationSeconds as ReelScriptInput["durationSeconds"]) ?? 30,
          onCamera: body.onCamera !== false,
          brandVoice: body.brandVoice as string | undefined,
        };

        if (!input.topic) {
          return NextResponse.json({ error: "El campo 'topic' es requerido" }, { status: 400 });
        }

        const script = await generateReelScript(input);
        return NextResponse.json({ success: true, action, result: script });
      }

      // ─── SECUENCIA DE STORIES ─────────────────
      case "stories": {
        const input: StorySequenceInput = {
          topic: String(body.topic ?? ""),
          niche: (body.niche as StorySequenceInput["niche"]) ?? "general",
          objective: (body.objective as StorySequenceInput["objective"]) ?? "venta",
          cta: String(body.cta ?? "escríbeme al DM"),
          brandVoice: body.brandVoice as string | undefined,
        };

        if (!input.topic) {
          return NextResponse.json({ error: "El campo 'topic' es requerido" }, { status: 400 });
        }

        const sequence = await generateStorySequence(input);
        return NextResponse.json({ success: true, action, result: sequence });
      }

      // ─── CALENDARIO HYPER-ORGÁNICO ────────────
      case "calendar": {
        const input: CalendarInput = {
          niche: (body.niche as CalendarInput["niche"]) ?? "general",
          businessDescription: String(body.businessDescription ?? ""),
          growthStage: (body.growthStage as CalendarInput["growthStage"]) ?? "traccion",
          currentFollowers: body.currentFollowers as number | undefined,
          weeklyCapacity: (body.weeklyCapacity as CalendarInput["weeklyCapacity"]) ?? 4,
          businessGoal: String(body.businessGoal ?? "crecer en Instagram"),
          periodDays: (body.periodDays as CalendarInput["periodDays"]) ?? 30,
        };

        if (!input.businessDescription) {
          return NextResponse.json(
            { error: "El campo 'businessDescription' es requerido" },
            { status: 400 }
          );
        }

        const calendar = await generateReelCalendar(input);
        return NextResponse.json({ success: true, action, result: calendar });
      }

      // ─── AUDITORÍA ANTI-BAN ───────────────────
      case "anti-ban-audit": {
        const input: AntiBanAuditInput = {
          caption: String(body.caption ?? ""),
          hashtags: Array.isArray(body.hashtags)
            ? (body.hashtags as string[]).map(h => h.replace(/^#/, "").toLowerCase())
            : [],
          contentType: (body.contentType as AntiBanAuditInput["contentType"]) ?? "reel",
        };

        if (!input.caption && input.hashtags.length === 0) {
          return NextResponse.json(
            { error: "Se requiere al menos 'caption' o 'hashtags' para auditar" },
            { status: 400 }
          );
        }

        const auditResult = await runAntiBanAudit(input);
        return NextResponse.json({ success: true, action, result: auditResult });
      }

      // ─── ESPÍA DE COMPETENCIA ────────────────
      case "ad-spy": {
        const input: AdSpyInput = {
          competitors: Array.isArray(body.competitors)
            ? (body.competitors as string[])
            : [String(body.competitors ?? "")].filter(Boolean),
          niche: String(body.niche ?? "general"),
          platform: (body.platform as AdSpyInput["platform"]) ?? "meta",
          country: body.country as string | undefined,
          objective: body.objective as string | undefined,
        };

        if (!input.competitors.length) {
          return NextResponse.json(
            { error: "Se requiere al menos un competidor en el campo 'competitors'" },
            { status: 400 }
          );
        }

        if (input.competitors.length > 5) {
          return NextResponse.json(
            { error: "Máximo 5 competidores por solicitud" },
            { status: 400 }
          );
        }

        const report = await runAdSpy(input);
        return NextResponse.json({ success: true, action, result: report });
      }

      // ─── COPYWRITER DE ADS LATAM ────────────
      case "ad-copy": {
        const input: AdCopyInput = {
          businessDescription: String(body.businessDescription ?? ""),
          adObjective: (body.adObjective as AdCopyInput["adObjective"]) ?? "whatsapp",
          niche: (body.niche as AdCopyInput["niche"]) ?? "general",
          platform: (body.platform as AdCopyInput["platform"]) ?? "meta",
          dailyBudget: body.dailyBudget as number | undefined,
          country: body.country as string | undefined,
          city: body.city as string | undefined,
          tone: body.tone as AdCopyInput["tone"],
          brandVoice: body.brandVoice as string | undefined,
          competitorIntelligence: body.competitorIntelligence as string | undefined,
          socialProof: body.socialProof as string | undefined,
        };

        if (!input.businessDescription) {
          return NextResponse.json(
            { error: "El campo 'businessDescription' es requerido" },
            { status: 400 }
          );
        }

        const adCopy = await generateAdCopy(input);
        return NextResponse.json({ success: true, action, result: adCopy });
      }

      // ─── ACTION DESCONOCIDO ───────────────────
      default:
        return NextResponse.json(
          {
            error: `Action '${action}' no reconocida`,
            validActions: ["reel-script", "stories", "calendar", "anti-ban-audit", "ad-spy", "ad-copy"],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`[/api/bh] Error en action '${action}':`, error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar la solicitud" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// GET /api/bh — Info del endpoint
// ─────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    name: "BH Skills API",
    version: "1.0.0",
    description: "Skills especializados para contenido de Instagram y Reels",
    actions: {
      "reel-script": {
        description: "Genera un guión completo para un Reel de Instagram",
        requiredFields: ["topic"],
        optionalFields: ["niche", "objective", "tone", "durationSeconds", "onCamera", "brandVoice"],
        example: {
          action: "reel-script",
          topic: "Los 3 errores más comunes al abrir un negocio de comida",
          niche: "gastronomia",
          objective: "educacion",
          durationSeconds: 30,
        },
      },
      stories: {
        description: "Genera una secuencia narrativa de Instagram Stories (5-7 slides)",
        requiredFields: ["topic", "cta"],
        optionalFields: ["niche", "objective", "brandVoice"],
        example: {
          action: "stories",
          topic: "Lanzamiento de nuevo menú de temporada",
          niche: "gastronomia",
          objective: "anuncio",
          cta: "escríbeme 'MENÚ' al DM para reservar",
        },
      },
      calendar: {
        description: "Genera un calendario de Reels para 14 o 30 días",
        requiredFields: ["businessDescription"],
        optionalFields: ["niche", "growthStage", "currentFollowers", "weeklyCapacity", "businessGoal", "periodDays"],
        example: {
          action: "calendar",
          businessDescription: "Restaurante de comida italiana en Bogotá, especialidad en pastas artesanales",
          niche: "gastronomia",
          growthStage: "traccion",
          currentFollowers: 2500,
          weeklyCapacity: 4,
          businessGoal: "llegar a 5000 seguidores y aumentar reservas en un 30%",
          periodDays: 30,
        },
      },
      "anti-ban-audit": {
        description: "Audita un caption y hashtags para detectar riesgo de shadowban",
        requiredFields: ["caption o hashtags"],
        optionalFields: ["contentType"],
        example: {
          action: "anti-ban-audit",
          caption: "¡Oferta especial! Gana dinero fácil desde casa. Escríbenos al link en bio 🤑💰",
          hashtags: ["follow4follow", "marketing", "emprendedor", "dinero"],
          contentType: "reel",
        },
      },
      "ad-spy": {
        description: "Analiza los ads pagados de la competencia en Meta Ad Library, TikTok Creative Center y Google Ads Transparency",
        requiredFields: ["competitors"],
        optionalFields: ["niche", "platform", "country", "objective"],
        example: {
          action: "ad-spy",
          competitors: ["MarcaA", "MarcaB"],
          niche: "restaurantes de comida italiana",
          platform: "meta",
          country: "CO",
          objective: "identificar ángulos no explotados para nuestra campaña",
        },
      },
      "ad-copy": {
        description: "Genera copy de ads pagados en español LATAM con 3 variantes de ángulo listas para Meta Ads Manager o TikTok Ads",
        requiredFields: ["businessDescription"],
        optionalFields: ["adObjective", "niche", "platform", "dailyBudget", "country", "city", "brandVoice", "competitorIntelligence", "socialProof"],
        example: {
          action: "ad-copy",
          businessDescription: "Restaurante de comida italiana en Bogotá, especialidad en pastas artesanales, precio promedio $45.000 COP por persona",
          adObjective: "whatsapp",
          niche: "gastronomia",
          platform: "meta",
          dailyBudget: 30,
          country: "CO",
          city: "Bogotá",
        },
      },
    },
  });
}
