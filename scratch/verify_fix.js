const { generateFreeText } = require('./src/lib/gemini-free');
// Note: We need to mock process.env or ensure it's loaded if running via node directly.
// But since this is a Next.js project, we can run it with a simple wrapper if we have ts-node or just use node with .env.local.

const fs = require('fs');
const path = require('path');
const envContent = fs.readFileSync('.env.local', 'utf8');
const apiKey = envContent.match(/GOOGLE_GENAI_API_KEY=(.*)/)[1].trim();
process.env.GOOGLE_GENAI_API_KEY = apiKey;

async function testFallback() {
    console.log("Starting Fallback Test...");
    try {
        // This will now use the fallback list
        const response = await generateFreeText("Respond only with the word 'VERIFIED'");
        console.log("Response:", response);
        if (response.includes("VERIFIED")) {
            console.log("✅ Fallback/Generation Test Passed!");
        } else {
            console.log("❌ Unexpected response:", response);
        }
    } catch (e) {
        console.error("❌ Test Failed:", e.message);
    }
}

testFallback();
