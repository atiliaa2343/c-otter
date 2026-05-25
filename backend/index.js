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

const SAMPLE_PATH = path.join(__dirname, 'real_data.json');

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

// AI Search with embeddings
app.post('/api/ai/search', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // Load sample data to search through
    const items = loadSample();
    
    // If MongoDB is connected, use vector search
    let searchResults = [];
    let aiResponse = '';

    if (mongoClient && gridFsBucket) {
      // Use MongoDB Atlas vector search if available
      try {
        const db = mongoClient.db();
        const searchResultsFromDB = await performVectorSearch(db, query);
        searchResults = searchResultsFromDB.results;
        aiResponse = searchResultsFromDB.response;
      } catch (err) {
        console.log('Vector search failed, falling back:', err.message);
        // Fall back to semantic + keyword search
        const fallback = await performSemanticSearch(items, query);
        searchResults = fallback.results;
        aiResponse = fallback.response;
      }
    } else {
      // Fallback: perform semantic + keyword search without embeddings
      const fallback = await performSemanticSearch(items, query);
      searchResults = fallback.results;
      aiResponse = fallback.response;
    }

    res.json({ 
      query,
      response: aiResponse,
      results: searchResults 
    });
  } catch (err) {
    console.error('AI search failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Perform vector search using MongoDB Atlas vector search
async function performVectorSearch(db, query) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query, OPENAI_API_KEY);
  
  // Perform vector search on real_data collection (assuming we've loaded it)
  const results = await db.collection('real_data').aggregate([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: 150,
        limit: 5
      }
    },
    {
      $project: {
        _id: 0,
        name: 1,
        description: 1,
        address: 1,
        phone: 1,
        website: 1,
        tags: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ]).toArray();
  
  // Generate AI response based on top results
  const aiResponse = await generateAIResponse(query, results, OPENAI_API_KEY);
  
  return {
    results: results.map(r => formatHealthcareResult(r)),
    response: aiResponse
  };
}

// Perform semantic search using keyword matching and scoring
async function performSemanticSearch(items, query) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  // Expand query with synonyms for better matching
  const expandedQuery = expandQueryWithSynonyms(query);
  
  // Score items based on relevance to query
  const scoredItems = items.map(item => {
    let score = 0;
    const text = `${item.name || ''} ${item.description || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
    const queryTerms = expandedQuery.toLowerCase().split(/\s+/);
    
    // Exact phrase match (higher weight)
    if (text.includes(query.toLowerCase())) score += 15;
    
    // Individual term matches
    queryTerms.forEach(term => {
      if (text.includes(term)) score += 3;
    });
    
    // Boost for health/medical related content
    const healthTerms = ['health', 'medical', 'mental health', 'counseling', 'therapy', 'clinic', 'doctor', 'physician', 
                        'recovery', 'addiction', 'treatment', 'support', 'services', 'hotline', 'help'];
    if (item.tags && item.tags.some(tag => healthTerms.some(ht => tag.toLowerCase().includes(ht)))) {
      score += 2;
    }
    
    // Boost for specific searched terms in tags
    queryTerms.forEach(term => {
      if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term))) {
        score += 4;
      }
    });
    
    return { ...item, score };
  }).filter(item => item.score > 0);
  
  // Sort by score descending
  scoredItems.sort((a, b) => b.score - a.score);
  
  // Take top 8 (increased from 5 to get more relevant results)
  const topResults = scoredItems.slice(0, 8);
  
  // Generate AI summary using OpenAI if available
  let aiResponse = `I found ${topResults.length} relevant results for your query about "${query}".`;
  
  if (OPENAI_API_KEY && topResults.length > 0) {
    try {
      aiResponse = await generateAIResponseFromOpenAI(query, topResults, OPENAI_API_KEY);
    } catch (err) {
      console.log('OpenAI response generation failed, using fallback:', err.message);
      aiResponse = generateFallbackResponse(query, topResults);
    }
  } else {
    aiResponse = generateFallbackResponse(query, topResults);
  }
  
  return {
    results: topResults.map(formatHealthcareResult),
    response: aiResponse
  };
}

// Helper function to expand query with synonyms
function expandQueryWithSynonyms(query) {
  const synonyms = {
    'weed': ['weed', 'cannabis', 'marijuana', 'pot', 'thc', 'cannabinoid'],
    'marijuana': ['marijuana', 'cannabis', 'weed', 'pot', 'thc', 'cannabinoid'],
    'cannabis': ['cannabis', 'marijuana', 'weed', 'pot', 'thc', 'cannabinoid'],
    'opioid': ['opioid', 'opiates', 'narcotics', 'painkillers', 'heroin', 'fentanyl', 'prescription drugs'],
    'addiction': ['addiction', 'dependence', 'substance abuse', 'rehab', 'recovery', 'sobriety', 'dependence'],
    'doctor': ['doctor', 'physician', 'clinician', 'provider', 'practitioner', 'md', 'do'],
    'dr': ['dr', 'doctor', 'physician'],
    'med': ['med', 'medical', 'medicine', 'healthcare', 'clinical'],
    'health': ['health', 'healthcare', 'medical', 'wellness', 'wellbeing'],
    'clinic': ['clinic', 'center', 'centre', 'facility', 'office', 'practice'],
    'hotline': ['hotline', 'helpline', 'support line', 'crisis line', 'helpline'],
    'counseling': ['counseling', 'therapy', 'counsel', 'treatment', 'support', 'psychotherapy', 'therapist'],
    'mental health': ['mental health', 'psychological', 'psychiatric', 'behavioral health', 'counseling', 'therapy']
  };
  
  let expanded = query.toLowerCase();
  
  // Add synonyms for each term in the query
  Object.keys(synonyms).forEach(key => {
    if (expanded.includes(key)) {
      synonyms[key].forEach(synonym => {
        if (!expanded.includes(synonym)) {
          expanded += ` ${synonym}`;
        }
      });
    }
  });
  
  return expanded;
}

// Format result as HealthcareResult
function formatHealthcareResult(item) {
  return {
    id: item._id || item.id || String(Math.random()),
    title: item.name || 'Untitled',
    description: item.description || '',
    address: item.address || '',
    phone: item.phone || '',
    specialties: item.tags || [],
    hours: item.hours || ''
  };
}

// Generate embedding using OpenAI
async function generateEmbedding(text, openaiApiKey) {
  if (!openaiApiKey) {
    // Return a zero vector as fallback
    return new Array(1536).fill(0);
  }
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate embedding');
  }
  
  const data = await response.json();
  return data.data[0].embedding;
}

// Generate AI response using OpenAI
async function generateAIResponse(query, results, openaiApiKey) {
  if (!openaiApiKey || !results || results.length === 0) {
    return generateFallbackResponse(query, results);
  }
  
  const context = results.map(r => `${r.title}: ${r.summary || r.description || ''}`).join('\n\n');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful healthcare assistant. Provide concise, accurate responses based on the provided context.' },
        { role: 'user', content: `User question: ${query}\n\nRelevant information:\n${context}\n\nProvide a helpful response.` }
      ],
      max_tokens: 300
    })
  });
  
  if (!response.ok) {
    return generateFallbackResponse(query, results);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Generate fallback AI response without OpenAI
function generateFallbackResponse(query, results) {
  if (results.length === 0) {
    return `I couldn't find specific results for "${query}". Try searching for different terms related to healthcare, mental health, or campus services.`;
  }
  
  const titles = results.slice(0, 3).map(r => r.title || r.name).join(', ');
  return `I found several relevant results for "${query}", including: ${titles}. These resources should help address your query about healthcare and wellness topics.`;
}

// Generate AI response from OpenAI (alternative)
async function generateAIResponseFromOpenAI(query, results, openaiApiKey) {
  const context = results.map(r => `${r.title}: ${r.summary || r.description || ''}`).join('\n\n');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful healthcare assistant. Provide concise, accurate responses.' },
        { role: 'user', content: `Question: ${query}\n\nContext:\n${context}\n\nAnswer:` }
      ],
      max_tokens: 300
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// If MONGODB_URI is provided, connect and expose image routes.
const MONGODB_URI = process.env.MONGODB_URI;
let mongoClient = null;
let gridFsBucket = null;

// Admin credentials (in production, use proper user management with hashed passwords)
const ADMIN_CREDENTIALS = [
  { id: '1', email: 'admin@example.com', username: 'admin', password: 'admin123' }
];

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

    // Hours of operation API
    app.get('/api/hours', async (req, res) => {
      try {
        const hours = await mongoClient.db().collection('hours_of_operation').find({}).toArray();
        res.json({ data: hours });
      } catch (err) {
        console.error('Error fetching hours', err);
        res.status(500).json({ error: 'failed' });
      }
    });

    // Locations API
    app.get('/api/locations', async (req, res) => {
      try {
        const locations = await mongoClient.db().collection('locations').find({}).toArray();
        res.json({ data: locations });
      } catch (err) {
        console.error('Error fetching locations', err);
        res.status(500).json({ error: 'failed' });
      }
    });

    // Admin registration endpoint
    app.post('/api/admin/register', async (req, res) => {
      try {
        const { email, username, password } = req.body;
        
        // Validate input
        if (!email || !username || !password) {
          return res.status(400).json({ error: 'Email, username, and password are required' });
        }
        
        if (password.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Check if admin already exists
        const existingAdmin = ADMIN_CREDENTIALS.find(admin => admin.email === email || admin.username === username);
        if (existingAdmin) {
          return res.status(409).json({ error: 'Admin with this email or username already exists' });
        }
        
        // Create new admin (in production, hash the password)
        const newAdmin = {
          id: (ADMIN_CREDENTIALS.length + 1).toString(),
          email,
          username,
          password // In production: use bcrypt.hash(password, saltRounds)
        };
        
        ADMIN_CREDENTIALS.push(newAdmin);
        
        // Generate a simple token (in production, use JWT)
        const token = `admin-token-${newAdmin.id}-${Date.now()}`;
        
        res.json({ 
          token,
          user: {
            id: newAdmin.id,
            email: newAdmin.email,
            username: newAdmin.username
          }
        });
      } catch (err) {
        console.error('Admin registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
      }
    });

    // Admin login endpoint
    app.post('/api/admin/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Find admin
        const admin = ADMIN_CREDENTIALS.find(admin => admin.email === email && admin.password === password);
        if (!admin) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Generate a simple token (in production, use JWT)
        const token = `admin-token-${admin.id}-${Date.now()}`;
        
        res.json({ 
          token,
          user: {
            id: admin.id,
            email: admin.email,
            username: admin.username
          }
        });
      } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ error: 'Login failed' });
      }
    });

    // Admin stats endpoint
    app.get('/api/admin/stats', async (req, res) => {
      try {
        // In a real app, we would validate the token and fetch real stats
        // For now, return mock data
        res.json({ 
          contentItems: 42,
          users: 158,
          admins: ADMIN_CREDENTIALS.length
        });
      } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
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
