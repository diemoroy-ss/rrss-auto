const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testImproveIdea() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const apiKeyMatch = envContent.match(/GOOGLE_GENAI_API_KEY=(.*)/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

  if (!apiKey) {
    console.error("GOOGLE_GENAI_API_KEY missing in .env.local");
    return;
  }

  const idea = "Post sobre peluquería";
  const businessType = "Peluquería";

  console.log("Testing with API Key:", apiKey.substring(0, 8) + "...");
  console.log("Model: gemini-1.5-flash");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `Eres un experto en marketing digital y estratega de contenido para redes sociales. 
        Tu objetivo es tomar una idea básica de un usuario para un post y mejorarla para que sea más profesional, persuasiva y adaptada a su nicho de negocio.
        
        INSTRUCCIONES:
        1. Considera el "Rubro o Tipo de Negocio" proporcionado.
        2. Mantén la esencia de la idea original pero usa un lenguaje más dinámico y enfocado a la conversión.
        3. No entregues el post final, entrega la "Descripción Mejorada" que se usará para generar el diseño.
        4. Responde ÚNICAMENTE con la descripción mejorada, sin explicaciones ni introducciones.`
    });

    const prompt = `Negocio: ${businessType || "General"}\nIdea Original: ${idea}\n\nDescripción Mejorada:`;
    
    console.log("Sending request to Gemini...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    console.log("SUCCESS!");
    console.log("Improved Idea:", text);
  } catch (error) {
    console.error("ERROR DETECTED:");
    if (error.status) console.error("Status:", error.status);
    console.error("Message:", error.message);
    if (error.response) {
       console.error("Response Data:", JSON.stringify(error.response, null, 2));
    }
  }
}

testImproveIdea();
