import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = "AIzaSyCJOfOy8GzJT89W4iwWCf9werrG8zaWwmE";
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
  console.log("Testing:", modelName);
  const model = genAI.getGenerativeModel({ model: modelName });
  const prompt = "Hola";
  try {
    const result = await model.generateContent(prompt);
    console.log("SUCCESS:", modelName, await result.response.text());
  } catch (e) {
    if (e.message.includes("404")) {
      console.error("FAIL 404:", modelName);
    } else {
      console.error("FAIL (other):", modelName, e.message);
    }
  }
}

async function run() {
  await testModel("gemini-1.5-flash");
  await testModel("gemini-1.5-flash-latest");
  await testModel("gemini-pro");
  await testModel("gemini-1.0-pro");
  // Some regions only have older models or specific namings.
}
run();
