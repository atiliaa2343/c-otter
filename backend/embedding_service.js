/**
 * Embedding Service - Manages text embeddings and vector search
 * Supports both OpenAI embeddings and MongoDB Atlas vector search
 */

const { MongoClient } = require('mongodb');

class EmbeddingService {
  constructor(options = {}) {
    this.mongoUri = options.mongoUri || process.env.MONGODB_URI;
    this.openaiApiKey = options.openaiApiKey || process.env.OPENAI_API_KEY;
    this.model = options.model || 'text-embedding-ada-002';
    this.dimensions = options.dimensions || 1536;
    this.client = null;
    this.db = null;
  }

  async connect() {
    if (this.client) return;
    try {
      this.client = new MongoClient(this.mongoUri);
      await this.client.connect();
      this.db = this.client.db('c-otter');
      console.log('Connected to MongoDB for embeddings');
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err.message);
      throw err;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  /**
   * Generate embedding for a text string using OpenAI API
   * Falls back to a simple hash-based vector if no API key
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required for embedding generation');
    }

    if (this.openaiApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            input: text,
            dimensions: this.dimensions,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
      } catch (err) {
        console.warn('OpenAI embedding failed, using mock:', err.message);
        return this._generateMockEmbedding(text);
      }
    } else {
      return this._generateMockEmbedding(text);
    }
  }

  /**
   * Generate a deterministic mock embedding based on text content
   * Useful for testing without OpenAI API
   */
  _generateMockEmbedding(text) {
    const embedding = new Array(this.dimensions).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    const wordHashes = words.map(w => this._hashString(w));

    wordHashes.forEach((hash, idx) => {
      const position = Math.abs(hash) % this.dimensions;
      embedding[position] += 1.0;
      // Spread influence to neighboring dimensions
      if (position > 0) embedding[position - 1] += 0.5;
      if (position < this.dimensions - 1) embedding[position + 1] += 0.5;
    });

    // Normalize to unit vector
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );

    if (magnitude > 0) {
      return embedding.map(val => val / magnitude);
    }

    return embedding;
  }

  /**
   * Simple string hash function
   */
  _hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return hash;
  }

  /**
   * Compute cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same dimensions');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Index documents with embeddings
   */
  async indexDocuments(collectionName, documents) {
    if (!this.db) await this.connect();
    const collection = this.db.collection(collectionName);

    console.log(`Generating embeddings for ${documents.length} documents...`);

    const indexedDocs = [];
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const text = this._extractTextForEmbedding(doc);
      const embedding = await this.generateEmbedding(text);

      indexedDocs.push({
        ...doc,
        embedding,
        embedding_text: text,
        indexed_at: new Date().toISOString(),
      });

      if ((i + 1) % 10 === 0) {
        process.stdout.write(`\rProcessed ${i + 1}/${documents.length}`);
      }

      // Rate limiting for OpenAI API
      if (this.openaiApiKey && (i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n\nInserting indexed documents...');
    await collection.deleteMany({});
    await collection.insertMany(indexedDocs);

    console.log(`✓ Successfully indexed ${indexedDocs.length} documents`);

    return indexedDocs;
  }

  /**
   * Extract relevant text from document for embedding
   */
  _extractTextForEmbedding(doc) {
    const parts = [
      doc.title || '',
      doc.summary || '',
      doc.description || '',
      doc.domain || '',
      doc.type || '',
      doc.content || ''
    ].filter(Boolean);

    return parts.join(' ');
  }

  /**
   * Search using MongoDB Atlas vector search
   */
  async atlasVectorSearch(query, collectionName = 'sample_data', limit = 5) {
    if (!this.db) await this.connect();
    const collection = this.db.collection(collectionName);

    const queryEmbedding = await this.generateEmbedding(query);

    const results = await collection.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 150,
          limit: limit,
        },
      },
      {
        $project: {
          _id: 0,
          title: 1,
          summary: 1,
          description: 1,
          url: 1,
          source: 1,
          domain: 1,
          type: 1,
          published_at: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]).toArray();

    return results;
  }

  /**
   * Search using local cosine similarity (no MongoDB Atlas required)
   */
  async localVectorSearch(query, collectionName = 'sample_data', limit = 5) {
    if (!this.db) await this.connect();
    const collection = this.db.collection(collectionName);

    const queryEmbedding = await this.generateEmbedding(query);
    const documents = await collection.find({}).toArray();

    const scoredDocs = documents.map(doc => {
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
      return { ...doc, similarity };
    });

    scoredDocs.sort((a, b) => b.similarity - a.similarity);

    return scoredDocs.slice(0, limit);
  }

  /**
   * Perform hybrid search combining vector and keyword search
   */
  async hybridSearch(query, collectionName = 'sample_data', limit = 5) {
    if (!this.db) await this.connect();
    const collection = this.db.collection(collectionName);

    const queryEmbedding = await this.generateEmbedding(query);
    const documents = await collection.find({}).toArray();

    const queryTerms = query.toLowerCase().split(/\s+/);

    const scoredDocs = documents.map(doc => {
      // Vector similarity score
      const vectorScore = this.cosineSimilarity(queryEmbedding, doc.embedding);

      // Keyword score
      const searchableText = this._extractTextForEmbedding(doc).toLowerCase();
      let keywordScore = 0;

      // Exact phrase match
      if (searchableText.includes(query.toLowerCase())) {
        keywordScore += 0.5;
      }

      // Individual term matches
      queryTerms.forEach(term => {
        if (searchableText.includes(term)) {
          keywordScore += 0.2;
        }
      });

      // Combine scores (50% vector, 50% keyword)
      const combinedScore = (vectorScore * 0.5) + Math.min(keywordScore, 0.5);

      return { ...doc, combinedScore, vectorScore, keywordScore };
    });

    scoredDocs.sort((a, b) => b.combinedScore - a.combinedScore);

    return scoredDocs.slice(0, limit);
  }

  /**
   * Create Atlas Search index for vector search
   */
  async createVectorIndex(collectionName = 'sample_data') {
    // Note: Atlas indexes must be created via Atlas UI or API
    // This provides the index definition
    const indexDefinition = {
      mappings: {
        dynamic: true,
        fields: {
          embedding: {
            type: 'knnVector',
            dimensions: this.dimensions,
            similarity: 'cosine',
          },
        },
      },
    };

    console.log('Atlas Vector Index Definition:');
    console.log(JSON.stringify(indexDefinition, null, 2));
    console.log('\nTo create this index:');
    console.log('1. Go to MongoDB Atlas UI');
    console.log('2. Navigate to Search > Indexes');
    console.log('3. Create JSON Editor index with this definition');
    console.log('4. Name it "vector_index"');

    return indexDefinition;
  }
}

module.exports = EmbeddingService;

// CLI usage
if (require.main === module) {
  const action = process.argv[2];

  if (action === 'index') {
    const { loadSample } = require('./index');
    const items = loadSample();

    const service = new EmbeddingService();
    service.connect()
      .then(() => service.indexDocuments('sample_data', items))
      .then(() => service.disconnect())
      .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
      });
  } else if (action === 'search') {
    const query = process.argv[3] || 'mental health';
    const service = new EmbeddingService();
    service.connect()
      .then(() => service.hybridSearch(query))
      .then(results => {
        console.log(`\nSearch results for: "${query}"`);
        console.log('=' .repeat(60));
        results.forEach((doc, i) => {
          console.log(`\n${i + 1}. ${doc.title}`);
          console.log(`   Score: ${doc.combinedScore?.toFixed(4) || doc.similarity?.toFixed(4)}`);
          console.log(`   ${doc.summary || doc.description || ''}`);
        });
      })
      .then(() => service.disconnect())
      .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  node embed_data.js index    - Index all documents with embeddings');
    console.log('  node embed_data.js search   - Test search (query optional)');
  }
}