import { NextRequest, NextResponse } from "next/server";
import { generateFreeText } from "../../../lib/gemini-free";
import { adminDb } from "../../../lib/firebase-admin";

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

    // 5. ENVIAR CORREO (Webhook n8n demo-ia)
    if (email) {
      const webhookDemoUrl = process.env.NODE_ENV === 'production' 
        ? 'https://n8n.santisoft.cl/webhook/demo-ia'
        : 'https://n8n.santisoft.cl/webhook-test/demo-ia';

      fetch(webhookDemoUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre || "Lead Anónimo",
          email: email,
          rubro: rubro,
          promo: promo,
          demoType: demoType,
          generatedText: finalContent,
          img_url: imgUrl,
          isLead: true,
          date: new Date().toISOString()
        })
      }).catch(err => {
        console.error("[demo-advanced n8n webhook error]:", err);
      });
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
