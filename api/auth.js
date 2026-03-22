let users = [];

export default function handler(req, res) {
  const { username, password, type } = req.body;

  if (type === "signup") {
    if (users.find(u => u.username === username))
      return res.json({ error: "User exists" });

    users.push({ username, password });
    return res.json({ success: true });
  }

  if (type === "login") {
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.json({ error: "Invalid" });

    return res.json({ success: true });
  }
}
