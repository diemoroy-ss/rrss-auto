import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const EVOLUTION_URL = (process.env.EVOLUTION_API_URL || "https://evoapi.grupofugas.cl").trim().replace(/^["']|["']$/g, "").replace(/\/$/, "");
const rawInstance = (process.env.EVOLUTION_INSTANCE_NAME || "Santisoft").trim().replace(/^["']|["']$/g, "");
const EVOLUTION_INSTANCE = rawInstance.toLowerCase() === "santisoft" ? "Santisoft" : rawInstance;
const EVOLUTION_API_KEY = (process.env.EVOLUTION_API_KEY || "6833CC358FA4-42E4-8F45-E74D35CC85A7").trim().replace(/^["']|["']$/g, "");
const N8N_EVOAPI_WEBHOOK_URL = process.env.N8N_EVOAPI_WEBHOOK_URL || "https://n8n.santisoft.cl/webhook/evoapi";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, email, telefono, mensaje, rubro, imageTextPreference } = body;

    if (!nombre || (!email && !telefono) || !mensaje) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const isSampleRequest = Boolean(rubro || mensaje?.toLowerCase().includes("muestra"));
    const visualModeLabel = imageTextPreference === "con_texto" 
      ? "Solo con texto comercial (carteles con precios)" 
      : imageTextPreference === "sin_texto" 
      ? "Solo sin texto comercial (fotos limpias)" 
      : "Mixto (con y sin texto comercial)";

    const isRealEmail = Boolean(
      email &&
      typeof email === 'string' &&
      email.includes('@') &&
      !email.endsWith('@contacto.temporal') &&
      !email.includes('example.com')
    );

    // 1. Guardar en Firestore como respaldo en contact_messages
    if (adminDb) {
      try {
        await adminDb.collection('contact_messages').add({
          nombre,
          email: isRealEmail ? email : "",
          telefono: telefono || "",
          mensaje,
          rubro: rubro || "",
          imageTextPreference: imageTextPreference || "mixto",
          isSampleRequest,
          createdAt: new Date(),
          status: 'unread',
        });

        // Si es solicitud de muestra, registrar en admin_prospect_demos para visibilidad del equipo
        if (isSampleRequest) {
          await adminDb.collection('admin_prospect_demos').add({
            prospectBusiness: nombre,
            prospectName: nombre,
            prospectPhone: telefono || "",
            prospectEmail: isRealEmail ? email : "",
            rubro: rubro || "General",
            imageTextPreference: imageTextPreference || "mixto",
            status: "solicitada",
            source: "como-funciona",
            createdAt: new Date(),
            notes: mensaje || "",
          });
        }
      } catch (dbErr: any) {
        console.warn("[Contact Route] Error guardando en Firestore:", dbErr.message);
      }
    }

    // 2. Envío de correos vía Nodemailer (Santisoft Admin + Cliente)
    const { SMTP_EMAIL, SMTP_PASSWORD } = process.env;
    const adminTargetEmail = process.env.NOTIFICATION_EMAIL || "santisoftai@gmail.com";

    if (SMTP_EMAIL && SMTP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: SMTP_EMAIL,
          pass: SMTP_PASSWORD,
        },
      });

      // A) Correo de notificación al administrador (Santisoft)
      const adminMailOptions = {
        from: `"Santisoft Contacto" <${SMTP_EMAIL}>`,
        to: adminTargetEmail,
        replyTo: isRealEmail ? email : undefined,
        subject: isSampleRequest
          ? `Nueva solicitud de muestra comercial: ${nombre} (${rubro || 'General'})`
          : `Nuevo mensaje de contacto de ${nombre}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #4f46e5; margin-top: 0;">${isSampleRequest ? "Nueva Solicitud de Muestra Gratuita" : "Nuevo Contacto - Santisoft"}</h2>
            <p style="color: #475569; font-size: 14px;">Has recibido una nueva solicitud desde la web.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 130px; color: #334155;">Negocio / Nombre:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">${nombre}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #334155;">Rubro:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${rubro || 'No especificado'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #334155;">Formato Visual:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">${visualModeLabel}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #334155;">WhatsApp:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">${telefono || 'No especificado'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #334155;">Email:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${isRealEmail ? email : 'No indicado'}</td>
              </tr>
            </table>
            <div style="margin-top: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p style="margin: 0; font-weight: bold; margin-bottom: 8px; color: #334155;">Mensaje / Detalle:</p>
              <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; color: #475569; font-size: 13px;">${mensaje}</p>
            </div>
          </div>
        `,
      };

      try {
        await transporter.sendMail(adminMailOptions);
        console.log(`[Contact Email] ✅ Correo de notificación enviado a Santisoft (${adminTargetEmail})`);
      } catch (mailErr: any) {
        console.error("[Contact Email] Error enviando correo al admin:", mailErr.message);
      }

      // B) Correo de confirmación automático al cliente (si entregó un email real)
      if (isRealEmail) {
        const clientMailOptions = {
          from: `"SocialPilot by Santisoft" <${SMTP_EMAIL}>`,
          to: email,
          subject: isSampleRequest
            ? `¡Recibimos tu solicitud de muestra para ${nombre}! 🚀`
            : `Recibimos tu mensaje, ${nombre} - SocialPilot by Santisoft`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">SocialPilot <span style="font-size: 14px; font-weight: normal; color: #ea580c;">by Santisoft</span></h1>
                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Automatización de redes sociales con agentes especializados</p>
              </div>

              <div style="background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e0e7ff;">
                <h2 style="color: #312e81; margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">¡Hola! 👋</h2>
                <p style="margin: 0; line-height: 1.6; color: #334155; font-size: 14px;">
                  ${isSampleRequest
                    ? `Confirmamos con éxito la recepción de tu solicitud para <strong>${nombre}</strong>${rubro ? ` (${rubro})` : ""}. Nuestros agentes especializados ya están analizando tu rubro comercial para preparar tu propuesta de muestra personalizada.`
                    : `Hemos recibido tu mensaje y nuestro equipo ya está revisando tu consulta.`
                  }
                </p>
              </div>

              ${isSampleRequest ? `
              <div style="margin-bottom: 20px;">
                <h3 style="color: #0f172a; font-size: 14px; font-weight: 700; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">¿Qué incluirá tu muestra comercial?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.8;">
                  <li><strong>Diseño visual adaptado:</strong> Propuesta visual personalizada (${visualModeLabel}).</li>
                  <li><strong>Posters y estilos para tu nicho:</strong> Formatos calibrados para tu negocio sin diseños genéricos.</li>
                  <li><strong>Calendario de prueba por 10 días:</strong> Planificación estratégica con horarios sugeridos y copys persuasivos.</li>
                </ul>
              </div>
              ` : ""}

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; color: #475569;">
                ${telefono ? `<p style="margin: 0 0 6px 0;">📱 Te escribiremos al WhatsApp <strong>${telefono}</strong> en cuanto la propuesta esté lista.</p>` : ""}
                <p style="margin: 0;">💬 Si deseas sumar algún detalle, logo o foto de producto adicional, puedes responder directamente a este correo.</p>
              </div>

              <div style="text-align: center; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
                <p style="margin: 0;">Santisoft • Santiago de Chile • <a href="https://rrss.santisoft.cl" style="color: #6366f1; text-decoration: none;">rrss.santisoft.cl</a></p>
              </div>
            </div>
          `,
        };

        try {
          await transporter.sendMail(clientMailOptions);
          console.log(`[Contact Email] ✅ Correo de confirmación entregado al cliente (${email})`);
        } catch (clientErr: any) {
          console.warn("[Contact Email] Error enviando correo al cliente:", clientErr.message);
        }
      }
    } else {
      console.warn("[Contact Email] SMTP credentials no configuradas. Omitiendo envío de correo.");
    }

    // 3. Envío automático por WhatsApp vía Evolution API
    if (telefono) {
      let cleanPhone = telefono.replace(/[\s\-\(\)\+]/g, "").replace(/^0+/, "");
      if (cleanPhone.length === 9 && cleanPhone.startsWith("9")) {
        cleanPhone = "56" + cleanPhone;
      }

      if (cleanPhone.length >= 8) {
        const whatsappMessage = isSampleRequest
          ? `¡Hola! 👋 Confirmamos la recepción de tu solicitud para *${nombre}*${rubro ? ` (${rubro})` : ""}.\n\nNuestros agentes especializados ya están preparando tu muestra comercial gratuita (${visualModeLabel}), con estilos visuales adaptados a tu negocio y el calendario de prueba por 10 días.\n\nEn cuanto tengamos la propuesta lista te compartiremos el enlace interactivo por este mismo chat. Si quieres coordinar algún detalle adicional o enviarnos tu logo o foto de producto, respóndeme directamente aquí.`
          : `¡Hola ${nombre}! 👋 Hemos recibido tu mensaje en SocialPilot by Santisoft. Nuestro equipo de agentes se pondrá en contacto contigo a la brevedad. ¡Muchas gracias por escribirnos!`;

        try {
          const evoRes = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              apikey: EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
              number: cleanPhone,
              text: whatsappMessage,
            }),
            signal: AbortSignal.timeout(8000),
          });

          if (evoRes.ok) {
            console.log(`[Contact WhatsApp] ✅ Mensaje entregado a ${cleanPhone} vía Evolution API`);
            if (N8N_EVOAPI_WEBHOOK_URL) {
              fetch(N8N_EVOAPI_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({
                  phone: cleanPhone,
                  number: cleanPhone,
                  text: whatsappMessage,
                  origin: "contacto_web",
                  businessName: nombre,
                  timestamp: new Date().toISOString(),
                }),
                signal: AbortSignal.timeout(3000),
              }).catch(() => {});
            }
          } else {
            const errBody = await evoRes.text().catch(() => "");
            console.warn(`[Contact WhatsApp] Evolution API respondió ${evoRes.status}: ${errBody}`);
          }
        } catch (waErr: any) {
          console.warn("[Contact WhatsApp] Error enviando WhatsApp al cliente:", waErr.message);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in contact route:", error);
    return NextResponse.json({ error: error.message || "Error processing contact request" }, { status: 500 });
  }
}
