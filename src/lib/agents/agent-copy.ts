import { getVertexModel } from "../vertexai";
import { generateFreeText } from "../gemini-free";

export interface CopyAgentParams {
  idea: string;
  targetProfile: any;
}

/**
 * Agente de Copywriter Persuasivo:
 * Genera copys persuasivos y atractivos humanizados, garantizando la inyección
 * de los datos de contacto y la marca del cliente. Posee respaldo doble (Vertex AI -> Gemini Free).
 */
export async function generateCopyWithAgent(params: CopyAgentParams): Promise<string> {
  const { idea, targetProfile } = params;

  const rubro = targetProfile?.rubro || targetProfile?.businessType || 'General';
  const businessName = targetProfile?.businessName || targetProfile?.companyName || targetProfile?.name || '';
  const desc = targetProfile?.businessDescription || targetProfile?.description || '';

  // Configuración de datos de contacto
  const includeWeb = targetProfile?.includeWebsiteInCopy !== false;
  const includeEmail = targetProfile?.includeEmailInCopy !== false;
  const includePhone = targetProfile?.includePhoneInCopy !== false;

  const contactArr: string[] = [];
  if (includeWeb && targetProfile?.website) contactArr.push(`🌐 Visita: ${targetProfile.website}`);
  if (includeEmail && targetProfile?.email) contactArr.push(`📧 Escríbenos: ${targetProfile.email}`);
  if (includePhone && targetProfile?.phone) contactArr.push(`📞 WhatsApp: ${targetProfile.phone}`);

  let contactInfoBlock = '';
  if (contactArr.length > 0) {
    contactInfoBlock = `\nDATOS DE CONTACTO DE LA MARCA (Es OBLIGATORIO incluirlos intactos al final del copy, justo después del CTA principal):\n${contactArr.join(' | ')}`;
  }

  let brandContextBlock = `\nCONTEXTO DE LA MARCA/NEGOCIO:\n- Nombre: ${businessName || 'Nuestra marca'}\n- Rubro/Industria: ${rubro}`;
  if (desc) {
    brandContextBlock += `\n- Descripción: ${desc}`;
  }

  const sysInstruction = `Eres un Copywriter estrella especializado en redes sociales y respuesta directa. Tu misión es transformar una idea en un copy altamente persuasivo, humano y atractivo.

⛔ FORMATO DE RESPUESTA — CRÍTICO:
- Responde ÚNICAMENTE con el texto del copy listo para publicar.
- JAMÁS envuelvas tu respuesta en JSON, diccionarios, objetos, comillas de JSON ni bloques de código.
- JAMÁS uses estructuras como { "copy": ... }, { "post_copy": ... } o similares.
- JAMÁS pongas comillas al inicio y al final del texto completo.
- El texto debe comenzar directamente con el Hook/Gancho sin introducción previa.

REGLAS DE ORO DE COPYWRITING & HUMANIZACIÓN:
1. Aplica obligatoriamente un tono 100% natural, cercano, fluido y directo ("tú a tú").
2. Queda ESTRICTAMENTE PROHIBIDO usar clichés/muletillas de IA como "En el vertiginoso mundo actual", "En conclusión", "Desbloquea el potencial", "Sumérgete en", "Descubre cómo", "Potencia tu", "In today's fast-paced world".
3. NUNCA menciones "IA" ni "Inteligencia Artificial". Si hiciera falta referirse a la tecnología o solución, utiliza "nuestros agentes" o "nuestro equipo de agentes especializados".
4. Estructura recomendada:
   - Gancho inicial atrapante (Hook de 1 línea).
   - Desarrollo del problema/solución con valor real.
   - Llamado a la acción (CTA) claro y directo.
   - Datos de contacto obligatorios de la marca al final.
   - 3-5 Hashtags estratégicos (solo el texto del hashtag, sin links ni URLs).

${brandContextBlock}
${contactInfoBlock}`;

  const userPrompt = `Idea / Tema del Post: ${idea}\n\nEscribe el copy final listo para publicar:`;

  // Intento 1: Vertex AI
  try {
    console.log(`[AgentCopy] Generando copy persuasivo con Vertex AI...`);
    const vertexModel = await getVertexModel(undefined, sysInstruction);
    const vertexResult = await vertexModel.generateContent(userPrompt);
    const generatedText = (await vertexResult.response).candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (generatedText) {
      console.log(`[AgentCopy] ✅ Copy generado exitosamente vía Vertex AI.`);
      return cleanCopyFormat(generatedText);
    }
  } catch (vertexErr: any) {
    console.warn(`[AgentCopy] ⚠️ Vertex AI no disponible o falló (${vertexErr.message || vertexErr}). Ejecutando fallback a Gemini Free...`);
  }

  // Intento 2: Fallback a Gemini Free
  try {
    console.log(`[AgentCopy] Generando copy persuasivo con Gemini Free...`);
    const freeText = await generateFreeText(userPrompt, sysInstruction, true);
    if (freeText && freeText.trim()) {
      console.log(`[AgentCopy] ✅ Copy generado exitosamente vía Gemini Free.`);
      return cleanCopyFormat(freeText);
    }
  } catch (freeErr: any) {
    console.error(`[AgentCopy] ❌ Falló también el fallback de Gemini Free:`, freeErr);
  }

  // Intento 3: Fallback de seguridad (construcción manual garantizada)
  const contactSuffix = contactArr.length > 0 ? `\n\n${contactArr.join(' | ')}` : '';
  return cleanCopyFormat(`${idea}\n\nGuarda este post o contáctanos para más información.${contactSuffix}\n\n#${rubro.replace(/\s+/g, '')} #Marketing`);
}

/**
 * Limpia el texto en caso de que el modelo haya devuelto un objeto JSON (ej: { "copy": "..." })
 * o saltos de línea escapados de forma literal (\\n).
 */
function cleanCopyFormat(rawText: string): string {
  if (!rawText) return '';
  let cleaned = rawText.trim();

  // 1. Si viene envuelto en bloque de código markdown tipo ```json ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  // 2. Si es un JSON estructurado — extrae el valor de cualquier clave conocida
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleaned);
      // Lista completa de claves que podría usar el modelo
      const knownKeys = ['copy', 'post_copy', 'caption', 'text', 'post', 'content', 'message', 'body'];
      for (const key of knownKeys) {
        if (parsed[key] && typeof parsed[key] === 'string') {
          cleaned = parsed[key];
          break;
        }
      }
    } catch (e) {
      // Si falla el parseo JSON, extraemos con Regex el valor de CUALQUIER clave string del JSON
      const match = cleaned.match(/"[\w_]+"\s*:\s*"([\s\S]+?)"\s*\}\s*$/);
      if (match && match[1]) {
        cleaned = match[1];
      }
    }
  }

  // 2b. Si tras la extracción todavía empieza con { (JSON anidado), limpiar también el wrapper exterior
  if (cleaned.startsWith('{') && cleaned.includes('"')) {
    const match = cleaned.match(/"[\w_]+"\s*:\s*"([\s\S]+?)"\s*\}?\s*$/);
    if (match && match[1]) cleaned = match[1];
  }

  // 3. Reemplazar saltos de línea escapados como caracteres literales \n por saltos de línea reales
  cleaned = cleaned.replace(/\\n/g, '\n');

  // 4. Remover comillas de inicio y fin si quedaron envolviendo todo el copy
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();

  return cleaned;
}

