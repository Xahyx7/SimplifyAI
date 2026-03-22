let database = {};

export default function handler(req, res) {
  const { username, action, data } = req.body;

  if (!database[username]) database[username] = [];

  if (action === "save") {
    database[username].push(data);
    return res.json({ success: true });
  }

  if (action === "get") {
    return res.json({ history: database[username] });
  }
}
