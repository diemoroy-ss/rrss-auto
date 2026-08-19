import { NextRequest, NextResponse } from 'next/server';
import { generateFreeText } from "../../../../lib/gemini-free";
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { posts, profileName, userId, profileId } = await req.json();

    if (!posts || !Array.isArray(posts)) {
      return NextResponse.json({ error: "Posts data is required" }, { status: 400 });
    }

    let authUid = userId;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ') && adminAuth) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        authUid = decodedToken.uid;
      } catch (authErr) {
        console.warn('Token no válido en analyze-metrics:', authErr);
      }
    }

    // Prepare data summary to reduce token usage
    const metricsSummary = posts.map((p: any) => {
        const date = p.scheduledFor?.toDate ? p.scheduledFor.toDate().toLocaleDateString('es-ES') : 
                    (p.scheduledFor ? new Date(p.scheduledFor).toLocaleDateString('es-ES') : 'Fecha desconocida');
                    
        return `Fecha: ${date} | Red: ${p.networks?.join(', ')} | Tipo: ${p.type || 'Post'} | Texto/Idea: "${p.idea?.substring(0, 100)}..." -> Métricas: Alcance(${p.metrics?.reach || 0}), Interacciones(${ (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0) })`;
    }).join('\n');

    const systemInstruction = `Eres un experto Analista de Datos y Estratega de Marketing Digital Nivel Senior.
Tu objetivo es analizar el rendimiento de posts en redes sociales (Facebook, Instagram, LinkedIn, TikTok) y proveer un reporte accionable y profesional.
DEBES escribir en español neutro, con tono seguro, empático y constructivo, orientado a un negocio que quiere crecer.
IMPORTANTE: NUNCA menciones que eres una IA o Inteligencia Artificial. Refiérete a ti mismo y a tus acciones como "nuestros agentes" o "nuestro equipo de agentes especializados". Tampoco hables de "lo que se puede hacer con IA".

REGLAS ESTRICTAS DE FORMATO:
1. Debes responder OBLIGATORIAMENTE con un objeto JSON válido, sin Markdown (\`\`\`json) envolviéndolo, sólo la estructura en texto plano.
2. El JSON debe tener exactamente dos propiedades principales: "analysisHtml" y "recommendation".
3. "analysisHtml" debe ser un string con HTML válido (<h3>, <p>, <ul>, <li>, <strong>, <br/>). NO uses Markdown dentro del HTML. Usa tono motivador, directo y profesional.
4. "recommendation" debe ser un objeto con dos propiedades:
   - "goalId": Debe ser estrictamente uno de estos valores: "crecimiento" (si falta alcance), "ventas" (si hay alcance pero hay que monetizar), "autoridad" (si hay alcance pero faltan comentarios de valor/guardados), o "interaccion" (si la comunidad está apagada).
   - "reason": Un string de 1 o 2 oraciones explicando por qué recomiendas esta meta basada en los números.

ESTRUCCURA SUGERIDA:
<h3>Resumen Ejecutivo</h3>
<p>Breve párrafo sobre la salud de la cuenta.</p>
<h3>Lo que mejor funcionó</h3>
<ul>
  <li><strong>El formato ganador:</strong> (identificar si Reels o Posts rindieron más).</li>
  <li><strong>El contenido top:</strong> (mencionar brevemente el post con más impacto).</li>
</ul>
<h3>Oportunidades de Mejora</h3>
<ul>
  <li>...</li>
</ul>
<h3>Recomendación para la próxima Estrategia</h3>
<p>Dile qué objetivo generar la próxima vez y un pequeño tip táctico.</p>`;

    const prompt = `Analiza el el siguiente reporte de las últimas ${posts.length} publicaciones de la marca "${profileName}".
Datos de rendimiento:
${metricsSummary}

Por favor, genera el reporte JSON según tus instrucciones. Saca inferencias claras: si una red rinde mejor que otra, si un formato trajo más alcance interacciones, etc.`;
    
    console.log(`[GEMINI-FREE] Generating AI report for ${posts.length} posts of profile ${profileName}`);
    
    let rawResponse = (await generateFreeText(prompt, systemInstruction)) || "{}";
    
    // Limpiar si Gemini devuelve markdown alrededor del JSON
    rawResponse = rawResponse.replace(/```json/g, "").replace(/```html/g, "").replace(/```/g, "").trim();
    
    let parsedResult;
    try {
        parsedResult = JSON.parse(rawResponse);
    } catch (e) {
        console.warn("Fallo al parsear JSON, intentando aislar las llaves:", e);
        const match = rawResponse.match(/\{[\s\S]*\}/);
        if (match) {
            parsedResult = JSON.parse(match[0]);
        } else {
            throw new Error("La IA no devolvió un formato JSON válido.");
        }
    }

    const { analysisHtml, recommendation } = parsedResult;

    // Guardar en Firestore si tenemos credenciales
    let savedId = "temp-" + Date.now();
    if (authUid && profileId && adminDb) {
        try {
            const historyRef = adminDb.collection('users').doc(authUid).collection('businesses').doc(profileId).collection('analytics_history');
            const docRef = await historyRef.add({
                analysisHtml: analysisHtml || "",
                recommendation: recommendation || null,
                createdAt: new Date().toISOString()
            });
            savedId = docRef.id;
        } catch (saveErr) {
            console.error("Error guardando el historial de analitica", saveErr);
        }
    }

    return NextResponse.json({ 
        analysis: analysisHtml, 
        recommendation: recommendation,
        id: savedId
    });
  } catch (error: any) {
    console.error("[GEMINI-FREE ERROR] Error generating analysis:", error);
    return NextResponse.json({ error: error.message || "Failed to generate analysis" }, { status: 500 });
  }
}
