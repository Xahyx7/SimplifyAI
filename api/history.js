import clientPromise from "./db";

export default async function handler(req, res) {
  try {
    const { username, action, chatId, message } = req.body;

    const client = await clientPromise;
    const db = client.db("simplifyai");
    const users = db.collection("users");

    if (action === "saveMessage") {
      await users.updateOne(
        { username, "chats.chatId": chatId },
        {
          $push: {
            "chats.$.messages": message
          }
        }
      );

      // if chat not exists → create
      await users.updateOne(
        { username, "chats.chatId": { $ne: chatId } },
        {
          $push: {
            chats: {
              chatId,
              messages: [message]
            }
          }
        }
      );

      return res.json({ success: true });
    }

    if (action === "getChat") {
      const user = await users.findOne({ username });

      const chat = user?.chats?.find(c => c.chatId === chatId);

      return res.json({ messages: chat?.messages || [] });
    }

    if (action === "get") {
      const user = await users.findOne({ username });

      return res.json({ history: user?.chats || [] });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
