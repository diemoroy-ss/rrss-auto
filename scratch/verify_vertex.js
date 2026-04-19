const fs = require('fs');
const path = require('path');
const { VertexAI } = require('@google-cloud/vertexai');

// Manual read of .env.local to avoid dotenv dependency in scratch
async function verifyVertexAI() {
  console.log("Starting Vertex AI Verification...");
  
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const getVal = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
  };

  const project = getVal('GCP_PROJECT_ID');
  const location = getVal('GCP_TASKS_LOCATION') || 'us-central1';
  const clientEmail = getVal('GCP_CLIENT_EMAIL');
  let privateKey = getVal('GCP_PRIVATE_KEY');
  
  if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!project || !clientEmail || !privateKey) {
    console.error("Missing GCP credentials in .env.local");
    return;
  }

  console.log(`Using Project: ${project}`);
  console.log(`Using Service Account: ${clientEmail}`);

  try {
    const vertexAI = new VertexAI({
        project: project,
        location: location,
        googleAuthOptions: {
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            }
        }
    });

    const model = vertexAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: {
            role: 'system',
            parts: [{ text: 'Respond with "VERTEX AI IS WORKING" if you can hear me.' }]
        }
    });

    console.log("Sending request to Vertex AI...");
    const result = await model.generateContent("Test message");
    const response = await result.response;
    const text = response.candidates[0].content.parts[0].text;

    console.log("-------------------");
    console.log("RESPONSE SUCCESS!");
    console.log("Output:", text.trim());
    console.log("-------------------");
    console.log("The migration is active and using your Google Cloud credits.");

  } catch (error) {
    console.error("CRITICAL ERROR IN VERTEX AI MIGRATION:");
    console.error(error.message);
    if (error.stack) console.error(error.stack);
  }
}

verifyVertexAI();
