const apiKey = "AIzaSyCJOfOy8GzJT89W4iwWCf9werrG8zaWwmE";
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(console.error);
