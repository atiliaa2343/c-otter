const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const DATA_PATH = path.join(__dirname, 'sample_data.json');
const PORT = process.env.CONTENT_API_PORT || process.env.PORT || 4000;
const API_KEY = process.env.CONTENT_API_KEY || 'devtoken';

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to read sample data, returning empty array', err);
    return [];
  }
}

function saveData(items) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to write data', err);
    return false;
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, now: new Date().toISOString() }));

app.get('/api/content/latest', (req, res) => {
  const { domain, type = '', limit = '20' } = req.query;
  let items = loadData();
  if (domain) {
    items = items.filter((i) => String(i.domain).toLowerCase() === String(domain).toLowerCase());
  }
  if (type) {
    items = items.filter((i) => i.type === type);
  }
  items = items.sort((a, b) => new Date(b.published_at || b.ingested_at || 0) - new Date(a.published_at || a.ingested_at || 0));
  const n = Math.max(1, Math.min(100, Number(limit)));
  items = items.slice(0, n);
  res.json({ data: items });
});

app.get('/api/content/search', (req, res) => {
  const { q = '', domain } = req.query;
  let items = loadData();
  if (domain) {
    items = items.filter((i) => String(i.domain).toLowerCase() === String(domain).toLowerCase());
  }
  if (q) {
    const term = String(q).toLowerCase();
    items = items.filter((i) => (i.title && i.title.toLowerCase().includes(term)) || (i.summary && i.summary.toLowerCase().includes(term)));
  }
  items = items.slice(0, 100);
  res.json({ data: items });
});

// Protected manual ingest run - basic API key check
app.post('/api/ingest/run', (req, res) => {
  const key = req.header('x-api-key') || (req.header('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // Simulate ingestion: accept items in body or create a synthetic item
  const incoming = req.body && Array.isArray(req.body.items) ? req.body.items : [];
  const items = loadData();
  const now = new Date().toISOString();

  if (incoming.length > 0) {
    for (const it of incoming) {
      items.unshift({ ...it, ingested_at: now });
    }
  } else {
    // Create a single synthetic item for demo
    items.unshift({
      _id: `mock-${Date.now()}`,
      domain: 'general',
      type: 'news',
      title: `Manual ingest at ${now}`,
      summary: 'This is a test ingest created by the mock server.',
      url: 'https://example.org/manual-ingest',
      source: 'mock-server',
      published_at: now,
      ingested_at: now,
      tags: ['manual'],
    });
  }

  const ok = saveData(items);
  if (!ok) return res.status(500).json({ error: 'failed to persist' });
  res.json({ ok: true, added: incoming.length || 1 });
});

const server = app.listen(PORT, () => {
  console.log(`Mock content server listening on port ${PORT}`);
  console.log(`API key: ${API_KEY} (set CONTENT_API_KEY to override)`);
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
