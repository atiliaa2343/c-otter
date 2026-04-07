import { MongoClient } from "mongodb";
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const data = JSON.parse(fs.readFileSync("./sample_data.json", "utf-8"));

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("ce_otter");
    const collection = db.collection("practices");

    for (const practice of data) {
      console.log("Embedding:", practice.title);

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: `${practice.title} ${practice.summary}`,
      });

      const embedding = response.data[0].embedding;

      await collection.insertOne({
        ...practice,
        embedding,
      });
    }

    console.log("DONE");
    process.exit();
  } catch (err) {
    console.error("ERROR:", err);
  }
}

run();