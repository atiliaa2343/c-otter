// Script to generate embeddings for sample data and index in MongoDB
require('dotenv').config({ path: __dirname + '/../db/.env' });
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in db/.env');
  process.exit(1);
}

// Load sample data
const SAMPLE_PATH = path.join(__dirname, 'sample_data.json');
function loadSample() {
  try {
    const raw = fs.readFileSync(SAMPLE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

// Generate embedding using OpenAI API
async function generateEmbedding(text) {
  if (!OPENAI_API_KEY) {
    console.warn('No OPENAI_API_KEY set, using mock embedding');
    // Return a deterministic mock embedding based on text
    const mock = new Array(1536).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash;
    }
    mock[Math.abs(hash) % 1536] = 1.0;
    return mock;
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate embedding: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Create text to embed (combining relevant fields)
function createEmbeddingText(item) {
  return [
    item.title || '',
    item.summary || '',
    item.domain || '',
    item.type || '',
    item.description || ''
  ].filter(Boolean).join(' ');
}

async function indexData() {
  const client = new MongoClient(MONGODB_URI);
  const items = loadSample();

  if (items.length === 0) {
    console.log('No sample data to index');
    return;
  }

  try {
    await client.connect();
    const db = client.db('c-otter');

    // Delete existing data
    await db.collection('sample_data').deleteMany({});

    console.log(`Generating embeddings for ${items.length} items...`);

    // Process items in batches
    const batchSize = OPENAI_API_KEY ? 100 : 500; // Can process more without API calls
    const allDocuments = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const text = createEmbeddingText(item);
      const embedding = await generateEmbedding(text);

      const document = {
        ...item,
        embedding: embedding,
        embedding_text: text,
        indexed_at: new Date().toISOString()
      };

      allDocuments.push(document);

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`\rProcessed ${i + 1}/${items.length} items`);
      }

      // Small delay if using real API to avoid rate limits
      if (OPENAI_API_KEY && (i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n\nInserting documents into MongoDB...');
    await db.collection('sample_data').insertMany(allDocuments);

    console.log(`✓ Successfully indexed ${allDocuments.length} documents`);

    // Create vector search index (Atlas specific)
    console.log('\nNote: For vector search, create an Atlas Search index named "vector_index" with:');
    console.log(JSON.stringify({
      mappings: {
        dynamic: true,
        fields: {
          embedding: {
            type: 'knnVector',
            dimensions: 1536,
            similarity: 'cosine'
          }
        }
      }
    }, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
}

indexData();