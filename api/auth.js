import clientPromise from "./db";

// Simple hash function using SHA-256 (no extra packages needed!)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "simplifyai_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { username, password, type } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Basic validation
    if (username.length < 3) {
      return res.json({ error: "Username must be at least 3 characters" });
    }
    if (password.length < 4) {
      return res.json({ error: "Password must be at least 4 characters" });
    }

    const client = await clientPromise;
    const db = client.db("simplifyai");
    const users = db.collection("users");

    // Hash the password before storing/comparing
    const hashedPassword = await hashPassword(password);

    if (type === "signup") {
      const exists = await users.findOne({ username });

      if (exists) {
        return res.json({ error: "Username already taken" });
      }

      await users.insertOne({
        username,
        password: hashedPassword, // ✅ stored as hash, never plain text
        chats: [],
        createdAt: new Date()
      });

      return res.json({ success: true });
    }

    if (type === "login") {
      // Compare hashed password
      const user = await users.findOne({ username, password: hashedPassword });

      if (!user) {
        return res.json({ error: "Wrong username or password" });
      }

      return res.json({ success: true, username });
    }

    return res.status(400).json({ error: "Invalid request type" });

  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
