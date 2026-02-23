require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { runAll } = require('./ingest/runAll');
const { MongoClient, GridFSBucket } = require('mongodb');

const PORT = process.env.CONTENT_API_PORT || 4000;
const API_KEY = process.env.CONTENT_API_KEY || 'dev-content-key';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SAMPLE_PATH = path.join(__dirname, 'sample_data.json');

function loadSample() {
  try {
    const raw = fs.readFileSync(SAMPLE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function saveSample(items) {
  try {
    fs.writeFileSync(SAMPLE_PATH, JSON.stringify(items, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('saveSample failed', err);
    return false;
  }
}

app.get('/api/content/latest', (req, res) => {
  const domain = req.query.domain;
  const type = req.query.type;
  const limit = parseInt(req.query.limit || '50', 10);
  let items = loadSample();
  if (domain) items = items.filter((i) => String(i.domain).toLowerCase() === String(domain).toLowerCase());
  if (type) items = items.filter((i) => String(i.type).toLowerCase() === String(type).toLowerCase());
  items = items.slice(0, limit);
  res.json({ data: items });
});

app.get('/api/content/search', (req, res) => {
  const q = req.query.q;
  let items = loadSample();
  if (q) {
    const term = String(q).toLowerCase();
    items = items.filter((i) => (i.title && i.title.toLowerCase().includes(term)) || (i.summary && i.summary.toLowerCase().includes(term)));
  }
  items = items.slice(0, 100);
  res.json({ data: items });
});

// Protected manual ingest run - basic API key check
app.post('/api/ingest/run', async (req, res) => {
  const key = req.header('x-api-key') || (req.header('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // If items provided, append them
  const incoming = req.body && Array.isArray(req.body.items) ? req.body.items : [];
  if (incoming.length > 0) {
    const items = loadSample();
    const now = new Date().toISOString();
    for (const it of incoming) {
      items.unshift({ ...it, ingested_at: now });
    }
    const ok = saveSample(items);
    if (!ok) return res.status(500).json({ error: 'failed to persist' });
    return res.json({ ok: true, added: incoming.length });
  }

  // Otherwise trigger orchestrator
  try {
    const result = await runAll();
    // runAll now returns { items, logs }
    const items = Array.isArray(result.items) ? result.items : (Array.isArray(result) ? result : []);
    const logs = Array.isArray(result.logs) ? result.logs : [];
    return res.json({ ok: true, count: items.length, logs });
  } catch (err) {
    console.error('Ingest run failed', err);
    return res.status(500).json({ error: err.message });
  }
});

// If MONGODB_URI is provided, connect and expose image routes.
const MONGODB_URI = process.env.MONGODB_URI;
let mongoClient = null;
let gridFsBucket = null;

async function startServer() {
  if (MONGODB_URI) {
    try {
      mongoClient = new MongoClient(MONGODB_URI);
      await mongoClient.connect();
      const db = mongoClient.db();
      gridFsBucket = new GridFSBucket(db, { bucketName: 'images' });
      console.log('Connected to MongoDB for GridFS image serving');
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err.message || err);
    }

    // List image filenames
    app.get('/api/images', async (req, res) => {
      if (!mongoClient) return res.status(500).json({ error: 'mongo not connected' });
      try {
        const files = await mongoClient.db().collection('images.files').find({}, { projection: { filename: 1, uploadDate: 1 } }).toArray();
        const filenames = files.map((f) => f.filename);
        res.json({ data: filenames });
      } catch (err) {
        console.error('Error listing images', err);
        res.status(500).json({ error: 'failed' });
      }
    });

    // Stream image by filename
    app.get('/images/:filename', async (req, res) => {
      const { filename } = req.params;
      if (!gridFsBucket) return res.status(500).send('mongo not connected');
      try {
        // set content-type based on extension (basic)
        const ext = path.extname(filename).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        res.setHeader('Content-Type', mime);
        const downloadStream = gridFsBucket.openDownloadStreamByName(filename);
        downloadStream.on('error', (err) => {
          console.error('GridFS download error', err);
          res.status(404).end();
        });
        downloadStream.pipe(res);
      } catch (err) {
        console.error('Error streaming image', err);
        res.status(500).end();
      }
    });
  }

  const server = app.listen(PORT, () => {
    console.log(`Mock content server listening on port ${PORT}`);
    console.log(`API key: ${API_KEY} (set CONTENT_API_KEY to override)`);
  });

  process.on('SIGINT', async () => {
    server.close(() => process.exit(0));
    if (mongoClient) await mongoClient.close();
  });
}

startServer();

process.on('SIGINT', () => server.close(() => process.exit(0)));
