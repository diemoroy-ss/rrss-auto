const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const apiKeyMatch = envContent.match(/GOOGLE_GENAI_API_KEY=(.*)/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

  if (!apiKey) {
    console.error("GOOGLE_GENAI_API_KEY missing");
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Note: The SDK might not have a direct listModels top-level, 
    // we might need to use the REST API via fetch if the SDK doesn't expose it easily.
    // However, we can try to use a standard model and see if it works.
    
    // Testing gemini-2.0-flash-exp just in case
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("Testing gemini-2.5-flash...");
    const result = await model.generateContent("Hi");
    console.log("Success with 2.5!");
  } catch (error) {
    console.error("Error with 2.5:", error.message);
  }
}

listModels();
