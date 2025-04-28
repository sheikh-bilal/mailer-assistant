export async function GeminiCall(emailText, prompt) {
  const apiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    "gemini-2.0-flash:generateContent?key=AIzaSyAwZdVj6Rr9XBEpI2o51ZtRmLmSCGnYLDI";

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }, { text: emailText }],
      },
    ],
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Gemini API error:", response.status, response.statusText);
      return "Error: could not call gemini.";
    }

    const data = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response available."
    );
  } catch (err) {
    console.error("Fetch error:", err);
    return "Error: failed to call gemini service.";
  }
}
