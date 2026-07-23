import { NextRequest, NextResponse } from "next/server";
import { generateFreeText } from "../../../lib/gemini-free";
import { adminDb } from "../../../lib/firebase-admin";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { rubro, promo, demoType = 'rrss', nombre, email } = await req.json();
    if (!rubro || !promo) {
      return NextResponse.json({ error: "Faltan parámetros rubro o promo" }, { status: 400 });
    }

    console.log(`[demo-advanced] Iniciando proceso para Rubro: ${rubro}, Promo: ${promo}`);

    // 1. GENERAR PROMPT DE IMAGEN
    const imagePromptInstruction = `Eres un experto creador de prompts (en inglés) para generadores de imágenes IA como Midjourney.
Crea un prompt descriptivo, foto-realista y de alta calidad para un negocio de: ${rubro}. 
El tema de la imagen debe ser: ${promo}.
INSTRUCCIÓN VITAL: Agrega al final del prompt que la imagen debe tener un estilo corporativo sutil, con colores acordes al rubro y, si es posible, un texto integrado o elemento gráfico que sirva de marca (watermark style). 
Responde ÚNICAMENTE con el prompt en inglés, sin explicaciones.`;

    const imgPrompt = await generateFreeText(imagePromptInstruction);
    console.log(`[demo-advanced] Image Prompt: ${imgPrompt}`);

    // 2. LLAMAR A N8N PARA GENERAR LA IMAGEN
    let imgUrl = "";
    try {
      const webhookImgUrl = 'https://n8n.santisoft.cl/webhook/img-rrss-auto';
      const imgRes = await fetch(webhookImgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptEnglish: imgPrompt,
          businessType: rubro,
          type: demoType
        })
      });

      if (imgRes.ok) {
        const imgData = await imgRes.json();
        // El webhook devuelve { status: 'ok', img_url: '...' }
        imgUrl = imgData.img_url || "";
      } else {
        console.error("[demo-advanced] Error webhook imagen:", await imgRes.text());
      }
    } catch (e) {
      console.error("[demo-advanced] Error fetching img webhook:", e);
    }

    // 3. GENERAR TEXTO (CON LOOP DE VALIDACIÓN)
    let finalContent = "";
    let isValid = false;
    let attempts = 0;
    let feedback = "";
    
    let baseInstruction = demoType === 'blog' 
        ? `Eres un experto SEO. Escribe un texto corto para un blog de ${rubro} sobre ${promo}. Debe ser directo, sin introducciones vacías, e ir al grano. Máximo 300 caracteres.`
        : `Eres un copywriter. Crea un post de redes sociales para un negocio de ${rubro} promocionando ${promo}. Incluye 3 hashtags. Sé persuasivo. Máximo 300 caracteres.`;

    while (!isValid && attempts < 3) {
        attempts++;
        const prompt = feedback 
            ? `${baseInstruction}\n\nEn tu intento anterior fallaste por lo siguiente: ${feedback}. Corrige el texto y generá uno nuevo que cumpla con los requisitos.`
            : `${baseInstruction}\n\nGenera el texto ahora.`;

        const draft = await generateFreeText(prompt);
        console.log(`[demo-advanced] Intento ${attempts}, longitud: ${draft.length}`);

        // Nodo Crítico (Validador)
        if (draft.length > 300) {
            feedback = `El texto es demasiado largo (${draft.length} caracteres). DEBE ser menor a 300 caracteres. Por favor, recórtalo manteniendo la idea principal.`;
            continue;
        }

        const validationPrompt = `Evalúa el siguiente texto generado para un negocio de ${rubro} sobre ${promo}:
"""${draft}"""

Responde únicamente con un JSON válido con dos campos:
- valid: boolean (true si el texto va directo al grano, no es muy abierto, y tiene relación directa con lo solicitado. false en caso contrario).
- reason: string (si es false, explica brevemente por qué. Si es true, déjalo vacío).`;

        try {
            const validationRaw = await generateFreeText(validationPrompt, "Eres un validador estricto.", true);
            const validation = JSON.parse(validationRaw);
            
            if (validation.valid === true) {
                isValid = true;
                finalContent = draft;
                console.log(`[demo-advanced] Texto validado con éxito en el intento ${attempts}.`);
            } else {
                feedback = validation.reason || "El texto no es lo suficientemente directo o relevante.";
                console.log(`[demo-advanced] Texto falló validación: ${feedback}`);
                finalContent = draft; // Fallback por si acaso
            }
        } catch (e) {
            console.error("[demo-advanced] Error parseando validación JSON", e);
            finalContent = draft;
            break; // Si falla el JSON parsing, nos quedamos con el borrador actual para no frenar el proceso
        }
    }

    if (!finalContent) {
        throw new Error("No se pudo generar un contenido válido.");
    }

    // 4. GUARDAR EN FIRESTORE
    if (email && adminDb) {
      try {
        await adminDb.collection('leads_demo').add({
          nombre: nombre || "Lead Anónimo",
          email: email,
          rubro: rubro,
          promo: promo,
          demoType: demoType,
          generatedText: finalContent,
          imageUrl: imgUrl,
          createdAt: new Date().toISOString()
        });
      } catch (dbErr) {
        console.error("[demo-advanced] Error guardando en Firestore:", dbErr);
      }
    }

    // 5. ENVIAR CORREO (Nodemailer en lugar de n8n)
    if (email) {
      if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        try {
          console.log(`[demo-advanced] Intentando enviar correo a ${email} vía SMTP: ${process.env.SMTP_EMAIL}`);
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD }
          });
          
          const imageHtml = imgUrl ? `
            <div style="text-align: center; margin: 20px auto; position: relative; max-width: 500px;">
              <div style="position: relative; display: inline-block; width: 100%;">
                <img src="${imgUrl}" alt="Contenido Generado" style="width: 100%; height: auto; border-radius: 8px; display: block; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
                <div style="position: absolute; top: 50%; left: 50%; width: 100%; transform: translate(-50%, -50%) rotate(-30deg); text-align: center; pointer-events: none;">
                  <span style="color: rgba(255,255,255,0.8); font-size: 38px; font-weight: 900; letter-spacing: 4px; text-shadow: 2px 2px 10px rgba(0,0,0,0.9), -1px -1px 4px rgba(0,0,0,0.5); font-family: Arial, sans-serif;">SANTISOFT.CL</span>
                </div>
              </div>
            </div>
          ` : '';
          const titleText = demoType === 'blog' ? 'Artículo de Blog' : 'Post de Redes Sociales';
          
          const info = await transporter.sendMail({
            from: `"Santisoft Automatización" <${process.env.SMTP_EMAIL}>`,
            to: email,
            subject: `¡Aquí está tu demostración de ${titleText}! 🚀`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                  <h2 style="color: #DD4B19;">¡Tu contenido está listo!</h2>
                  <p>Hola ${nombre || 'amigo(a)'},</p>
                  <p>Aquí tienes el resultado de tu prueba para el rubro de <strong>${rubro}</strong> promocionando <strong>${promo}</strong>.</p>
                  ${imageHtml}
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; border-left: 4px solid #DD4B19; margin-top: 20px;">
                      <p style="margin: 0; white-space: pre-wrap;"><em>"${finalContent}"</em></p>
                  </div>
                  <div style="margin-top: 30px; text-align: center;">
                    <a href="https://rrss.santisoft.cl/#planes" style="background-color: #DD4B19; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver Planes</a>
                    <a href={`https://rrss.santisoft.cl/agendar?n=${encodeURIComponent(nombre || "")}&e=${encodeURIComponent(email || "")}`} style="background-color: transparent; color: #333; border: 1px solid #ccc; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-left: 10px;">Agendar Demostración</a>
                  </div>
                  <p style="margin-top: 30px; font-size: 12px; color: #999;">Este es un mensaje automático de Santisoft.</p>
              </div>
            `
          });
          console.log(`[demo-advanced] Correo enviado exitosamente a ${email}. MessageId: ${info.messageId}`);
        } catch (err) {
          console.error("[demo-advanced nodemailer error]:", err);
        }
      } else {
        console.error("[demo-advanced] No se puede enviar correo: faltan credenciales SMTP (SMTP_EMAIL o SMTP_PASSWORD)");
      }
    } else {
      console.log("[demo-advanced] No se envió correo porque no se proporcionó un email en la solicitud");
    }

    return NextResponse.json({ 
        text: finalContent,
        imgUrl: imgUrl
    });
  } catch (err: any) {
    console.error("[demo-advanced error]:", err);
    return NextResponse.json({ error: err.message || "Error al generar la demo avanzada" }, { status: 500 });
  }
}
