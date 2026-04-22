require("dotenv").config();
const { MongoClient } = require("mongodb");

async function clearDB() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    await client.db("ce_otter").collection("practices").deleteMany({});
    console.log("CLEARED");
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

clearDB();