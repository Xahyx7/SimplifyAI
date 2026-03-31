import clientPromise from "./db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { username, action, chatId, message } = req.body;

    if (!username) {
      return res.status(400).json({ error: "No username provided" });
    }

    const client = await clientPromise;
    const db = client.db("simplifyai");
    const users = db.collection("users");

    // ✅ FIXED: Save message without creating duplicates
    if (action === "saveMessage") {
      const user = await users.findOne({ username });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const chatExists = user.chats?.some(c => c.chatId === chatId);

      if (chatExists) {
        // Chat exists → just push new message into it
        await users.updateOne(
          { username, "chats.chatId": chatId },
          {
            $push: {
              "chats.$.messages": message
            }
          }
        );
      } else {
        // Chat doesn't exist → create it with this first message
        await users.updateOne(
          { username },
          {
            $push: {
              chats: {
                chatId,
                createdAt: new Date(),
                messages: [message]
              }
            }
          }
        );
      }

      return res.json({ success: true });
    }

    // Get messages for one specific chat
    if (action === "getChat") {
      const user = await users.findOne({ username });
      const chat = user?.chats?.find(c => c.chatId === chatId);
      return res.json({ messages: chat?.messages || [] });
    }

    // Get all chats for sidebar history
    if (action === "get") {
      const user = await users.findOne({ username });
      return res.json({ history: user?.chats || [] });
    }

    return res.status(400).json({ error: "Invalid action" });

  } catch (err) {
    console.error("HISTORY ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}
