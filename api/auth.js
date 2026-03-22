import clientPromise from "./db";

export default async function handler(req, res) {
  const { username, password, type } = req.body;

  const client = await clientPromise;
  const db = client.db("simplifyai");
  const users = db.collection("users");

  if (type === "signup") {
    const exists = await users.findOne({ username });

    if (exists) {
      return res.json({ error: "User already exists" });
    }

    await users.insertOne({
      username,
      password,
      history: []
    });

    return res.json({ success: true });
  }

  if (type === "login") {
    const user = await users.findOne({ username, password });

    if (!user) {
      return res.json({ error: "Invalid credentials" });
    }

    return res.json({ success: true });
  }
}
