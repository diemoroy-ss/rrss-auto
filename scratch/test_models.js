const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModels() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const apiKeyMatch = envContent.match(/GOOGLE_GENAI_API_KEY=(.*)/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

  if (!apiKey) {
    console.error("GOOGLE_GENAI_API_KEY missing");
    return;
  }

  console.log("API Key found:", apiKey.substring(0, 10) + "...");

  // Listar modelos via REST API
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await resp.json();
    if (data.error) {
      console.error("List models error:", data.error.message);
    } else {
      const flashModels = data.models?.filter(m => m.name.includes('flash') || m.name.includes('gemini-2'));
      console.log("\nModelos Gemini Flash disponibles:");
      flashModels?.forEach(m => console.log(" -", m.name, "|", m.displayName));
    }
  } catch (e) {
    console.error("Error listing models:", e.message);
  }

  // Probar modelos específicos
  const modelsToTest = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
  ];

  const genAI = new GoogleGenerativeAI(apiKey);
  
  for (const modelName of modelsToTest) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Responde solo: OK");
      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log(`✅ ${modelName}: ${text?.trim()}`);
    } catch (error) {
      const msg = error.message || error.toString();
      const shortMsg = msg.includes('[429') ? '429 - Quota/Credits exhausted' :
                       msg.includes('[404') ? '404 - Model not found' :
                       msg.includes('[403') ? '403 - Forbidden' :
                       msg.substring(0, 80);
      console.log(`❌ ${modelName}: ${shortMsg}`);
    }
  }
}

testModels();
