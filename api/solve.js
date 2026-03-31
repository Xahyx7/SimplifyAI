export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { image, prompt } = req.body;

    if (!image && (!prompt || prompt.trim() === "")) {
      return res.status(400).json({ error: "No input provided" });
    }

    const userInstruction = prompt && prompt.trim() !== ""
      ? prompt
      : "Solve step by step clearly.";

    // 🧠 SMART SYSTEM PROMPT
    const systemPrompt = `You are an intelligent AI tutor for students.

Your job is to first understand the student's intent and then respond accordingly.

Step 1 - Identify what the student wants:
- Solve the question
- Check if their answer is correct
- Find mistakes
- Give only hint
- Explain concept
- Give short answer

Step 2 - Respond accordingly:
RULES:
- If student asks to CHECK → verify answer + explain mistakes
- If student asks for HINT → do NOT give full solution
- If student asks to SOLVE → give step-by-step solution
- If student asks CONCEPT → explain simply
- Always be clear, structured, and student-friendly

Step 3 - Format response like this:

🧠 Answer:
(Direct answer)

🪜 Steps:
(Numbered steps if solving)

⚠️ Mistake:
(If any mistake found)

💡 Tip:
(Small helpful tip)

Keep language simple and easy to understand.`;

    // ✅ FIXED: v1beta + system_instruction properly separated
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          // ✅ System prompt goes here, NOT inside contents
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              parts: [
                {
                  text: image
                    ? `Student uploaded an image. Request: ${userInstruction}`
                    : `Student question: ${userInstruction}`
                },
                ...(image
                  ? [{
                      inline_data: {
                        mime_type: "image/png",
                        data: image
                      }
                    }]
                  : [])
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      }
    );

    const geminiData = await geminiRes.json();

    // ✅ Log error from Gemini if any (helps debug)
    if (geminiData.error) {
      console.error("GEMINI ERROR:", geminiData.error);
      return res.status(500).json({ error: geminiData.error.message });
    }

    const answer =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No answer generated.";

    // 🎥 YouTube search
    const searchQuery = userInstruction.slice(0, 60);

    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        searchQuery
      )}&key=${process.env.YOUTUBE_API_KEY}&maxResults=2&type=video`
    );

    const ytData = await ytRes.json();

    res.status(200).json({
      answer,
      videos: ytData.items || []
    });

  } catch (error) {
    console.error("SOLVE ERROR:", error);
    res.status(500).json({
      error: "Something went wrong",
      details: error.message
    });
  }
}
