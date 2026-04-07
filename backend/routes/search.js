const express = require("express");
const { MongoClient } = require("mongodb");
const OpenAI = require("openai");
const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();

const client = new MongoClient(process.env.MONGODB_URI);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    await client.connect();
    const db = client.db("ce_otter");
    const collection = db.collection("practices");

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const queryEmbedding = response.data[0].embedding;

    const practices = await collection.find().toArray();

    const results = practices.map((p) => ({
  title: p.title,
  summary: p.summary,
  score: cosineSimilarity(queryEmbedding, p.embedding),
}));

    results.sort((a, b) => b.score - a.score);

    res.json(results.slice(0, 3));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;