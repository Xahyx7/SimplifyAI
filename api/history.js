import clientPromise from "./db";

export default async function handler(req, res) {
  const { username, action, data } = req.body;

  const client = await clientPromise;
  const db = client.db("simplifyai");
  const users = db.collection("users");

  if (action === "save") {
    await users.updateOne(
      { username },
      { $push: { history: data } }
    );

    return res.json({ success: true });
  }

  if (action === "get") {
    const user = await users.findOne({ username });

    return res.json({ history: user?.history || [] });
  }
}
