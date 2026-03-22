export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { image } = req.body;

    // 🧠 GEMINI CALL
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
                { text: "Solve this question step by step and explain simply." },
                {
                  inline_data: {
                    mime_type: "image/png",
                    data: image
                  }
                }
              ]
            }
          ]
        })
      }
    );

    const geminiData = await geminiRes.json();

    const answer =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No answer found";

    // 🎥 YOUTUBE SEARCH
    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        answer.slice(0, 80)
      )}&key=${process.env.YOUTUBE_API_KEY}&maxResults=2`
    );

    const ytData = await ytRes.json();

    res.status(200).json({
      answer,
      videos: ytData.items || []
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
