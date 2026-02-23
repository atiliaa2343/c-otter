require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in environment');
  process.exit(1);
}

async function listImages() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const filesColl = db.collection('images.files');
    const count = await filesColl.countDocuments();
    console.log(`Total files in GridFS (images.files): ${count}`);

    const files = await filesColl.find({}, { projection: { filename: 1, length: 1, uploadDate: 1 } }).limit(50).toArray();
    if (files.length === 0) {
      console.log('No files found.');
    } else {
      console.log('Sample files:');
      files.forEach((f) => console.log('-', f.filename));
    }
  } catch (err) {
    console.error('Error listing images:', err);
  } finally {
    await client.close();
  }
}

listImages();
