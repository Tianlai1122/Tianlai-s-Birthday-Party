// Shared leaderboard for the birthday page (Vercel serverless function).
// Needs an Upstash Redis store connected to the Vercel project; Vercel then
// provides the REST URL and token as environment variables.
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const BOARDS = ["drinks", "dodges", "snacks"];
const PREFIX = "bday2026:";

async function redis(commands) {
  const res = await fetch(REDIS_URL.replace(/\/$/, "") + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + REDIS_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(commands)
  });
  if (!res.ok) throw new Error("redis " + res.status);
  return res.json();
}

function toObject(flat) {
  const out = {};
  for (let i = 0; i + 1 < (flat || []).length; i += 2) {
    const n = Number(flat[i + 1]);
    if (n > 0) out[flat[i]] = n;
  }
  return out;
}

async function readAll() {
  const results = await redis(BOARDS.map((b) => ["HGETALL", PREFIX + b]));
  const data = {};
  BOARDS.forEach((b, i) => { data[b] = toObject(results[i] && results[i].result); });
  return data;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(503).json({ error: "no_storage" });
  try {
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const board = String(body.board || "");
      const name = String(body.name || "").trim().slice(0, 24);
      const delta = Number(body.delta) === -1 ? -1 : 1;
      if (!BOARDS.includes(board) || !name) return res.status(400).json({ error: "bad_request" });
      const [r] = await redis([["HINCRBY", PREFIX + board, name, String(delta)]]);
      if (r && Number(r.result) < 0) await redis([["HSET", PREFIX + board, name, "0"]]);
    } else if (req.method !== "GET") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "method" });
    }
    return res.status(200).json(await readAll());
  } catch (e) {
    return res.status(500).json({ error: "server" });
  }
};
