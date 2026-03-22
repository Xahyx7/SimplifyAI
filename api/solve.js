export default async function handler(req, res) {
  // ❌ Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  try {
    // 📥 Get data from frontend
    const { image, prompt } = req.body;

   // Allow either image OR text
if (!image && (!prompt || prompt.trim() === "")) {
  return res.status(400).json({ error: "No input provided" });
}

    // 🧠 Final AI instruction (dynamic based on user prompt)
    const userInstruction = prompt && prompt.trim() !== ""
      ? prompt
      : "Explain step by step in simple way for a student.";

    // 🤖 GEMINI API CALL
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
  {
    parts: [
      {
       text: image
  ? `You are a helpful study assistant.

A student has uploaded an image of a question or their solution.

First understand what the student is asking:
- If they want a solution → solve step by step
- If they want verification → check their answer and tell if correct
- If they want mistake analysis → find errors and explain
- If they want hint → give hint only
- If they want simple explanation → explain clearly

User request: ${userInstruction}

Respond accordingly in a clear and helpful way.`
  : `You are a helpful study assistant.

Answer this question clearly for a student:
${userInstruction}`
      },
      ...(image
        ? [
            {
              inline_data: {
                mime_type: "image/png",
                data: image
              }
            }
          ]
        : [])
    ]
  }
]
    const geminiData = await geminiRes.json();

    // 🧠 Extract answer safely
    const answer =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No answer generated.";

    // 🎥 YOUTUBE SEARCH (based on answer keywords)
    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        answer.slice(0, 80)
      )}&key=${process.env.YOUTUBE_API_KEY}&maxResults=2&type=video`
    );

    const ytData = await ytRes.json();

    // 📤 SEND RESPONSE
    res.status(200).json({
      answer,
      videos: ytData.items || []
    });

  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({
      error: "Something went wrong",
      details: error.message
    });
  }
}
