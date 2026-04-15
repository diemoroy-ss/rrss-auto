const apiKey = "AIzaSyCJOfOy8GzJT89W4iwWCf9werrG8zaWwmE";
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
      const validModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
      console.log("Models supporting generateContent:");
      validModels.forEach(m => console.log(m.name));
  })
  .catch(console.error);
