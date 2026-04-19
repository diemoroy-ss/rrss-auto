const fs = require('fs');
const path = require('path');
const { VertexAI } = require('@google-cloud/vertexai');

async function findCorrectModel() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const getVal = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
  };

  const project = getVal('GCP_PROJECT_ID');
  const clientEmail = getVal('GCP_CLIENT_EMAIL');
  let privateKey = getVal('GCP_PRIVATE_KEY');
  if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');

  const vertexAI = new VertexAI({
      project: project,
      location: 'us-central1',
      googleAuthOptions: { credentials: { client_email: clientEmail, private_key: privateKey } }
  });

  const modelsToTest = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-001',
      'gemini-2.0-flash',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash-001'
  ];

  for (const modelName of modelsToTest) {
      console.log(`Testing model: ${modelName}...`);
      try {
          const model = vertexAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent("ping");
          const response = await result.response;
          console.log(`✅ SUCCESS with ${modelName}`);
          return;
      } catch (error) {
          console.log(`❌ FAILED with ${modelName}: ${error.message.substring(0, 100)}`);
      }
  }
}

findCorrectModel();
