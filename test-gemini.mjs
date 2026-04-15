import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = "AIzaSyCJOfOy8GzJT89W4iwWCf9werrG8zaWwmE";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: `Eres un Community Manager Experto y Copywriter persuasivo. 
    Tu misión es redactar el texto O "Pie de Foto" (copy) que acompañará a la imagen publicitaria en redes sociales (Facebook/Instagram).
    
    INSTRUCCIONES CLAVES:
    - Toma la IDEA PRINCIPAL entregada y desarróllala en un texto súper atractivo, orientado a la acción y venta/engagement.
    - Te entregaré también el "Texto Descriptivo / Visual". Úsalo solo como contexto de lo que se verá en la imagen, PERO NO repitas las instrucciones visuales, solo escribe el pie de foto.
    - Usa emojis adecuados, viñetas si es necesario, y lenguaje cercano al cliente.
    - Cierra SIEMPRE con un Llamado a la Acción (CTA) fuerte.
    - NO MENCIONES LA IMAGEN en el texto de forma literal (nada de "En la imagen vemos...").
    - NADA de comillas iniciales ni introducciones. Pasa directo al copy final.`
});

const idea = "Publicación promocional genérica";
const textoVisual = "No hay instrucciones visuales específicas.";

const prompt = `Idea Principal del Post: ${idea}\nContexto Visual de la Imagen: ${textoVisual}\n\nEscribe el Pie de Foto (Copy) Listo para Publicar:`;

async function run() {
  try {
    const result = await model.generateContent(prompt);
    console.log("Success:\\n", await result.response.text());
  } catch (e) {
    console.error("FAIL:", e);
  }
}
run();
