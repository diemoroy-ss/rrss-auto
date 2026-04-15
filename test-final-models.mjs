import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = "AIzaSyCJOfOy8GzJT89W4iwWCf9werrG8zaWwmE";
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
  console.log("Testing:", modelName);
  const model = genAI.getGenerativeModel({ model: modelName });
  const prompt = "Dime un chiste corto de programacion";
  try {
    const result = await model.generateContent(prompt);
    console.log("SUCCESS:", modelName, await result.response.text());
  } catch (e) {
    console.error("FAIL:", modelName, e.message);
  }
}

async function run() {
  await testModel("gemini-1.5-flash"); // Should fail 404
  await testModel("gemini-2.0-flash"); // Just failed for user
  await testModel("gemini-2.5-flash"); // Test this one
  await testModel("gemini-flash-latest"); // Test alias
}
run();
