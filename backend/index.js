require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

const PORT = process.env.CONTENT_API_PORT || 4000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// AI Search — embeds the query with OpenAI, then asks Supabase's
// match_resources() function (pgvector cosine similarity, see
// db/schema_resources.sql) for the closest resources.
app.post('/api/ai/search', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const queryEmbedding = await generateEmbedding(query, OPENAI_API_KEY);

    const { data: matches, error } = await supabase.rpc('match_resources', {
      query_embedding: queryEmbedding,
      match_count: 8,
    });
    if (error) throw error;

    const searchResults = (matches || []).map(formatHealthcareResult);
    const aiResponse = searchResults.length > 0
      ? await generateAIResponse(query, searchResults, OPENAI_API_KEY)
      : generateFallbackResponse(query, searchResults);

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

// Format a match_resources() row as the HealthcareResult shape the app expects
function formatHealthcareResult(item) {
  return {
    id: item.id,
    title: item.name || 'Untitled',
    description: item.description || '',
    address: item.address || '',
    phone: item.phone || '',
    specialties: item.tags || [],
    score: item.similarity
  };
}

// Generate embedding using OpenAI — must stay text-embedding-3-small to
// match the model used in db/migrate_resources_to_supabase.js, since a
// query embedded with a different model isn't comparable to the stored ones.
async function generateEmbedding(text, openaiApiKey) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
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

const server = app.listen(PORT, () => {
  console.log(`Backend API listening on port ${PORT}`);
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
