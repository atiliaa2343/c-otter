/**
 * One-time migration: reads backend/real_data.json (454 real resource
 * records), generates an OpenAI embedding for each one, and inserts them
 * into Supabase's `resources` table (see db/schema_resources.sql — run
 * that first).
 *
 * Run from the project root:
 *
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key node db/migrate_resources_to_supabase.js
 *
 * The service role key is passed inline on purpose, not read from .env —
 * it bypasses row-level security, so it should only ever exist in your
 * terminal history for this one command, never saved to a file.
 * Find it in the Supabase dashboard: Settings -> API -> service_role key.
 *
 * Safe to run only once per fresh table — running it twice will insert
 * duplicates, since real_data.json records have no stable id to upsert on.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATA_PATH = path.join(__dirname, '..', 'backend', 'real_data.json');
const EMBEDDING_MODEL = 'text-embedding-3-small';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('Missing one of: EXPO_PUBLIC_SUPABASE_URL (.env), SUPABASE_SERVICE_ROLE_KEY (inline), OPENAI_API_KEY (.env)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function embed(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });
  if (!response.ok) {
    throw new Error(`OpenAI embedding failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.data[0].embedding;
}

async function main() {
  const { count, error: countError } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });
  if (countError) throw countError;
  if (count && count > 0) {
    console.warn(`Warning: resources already has ${count} row(s). Re-running will create duplicates.`);
  }

  const items = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  console.log(`Loaded ${items.length} records from real_data.json`);

  let done = 0;
  for (const item of items) {
    const text = [item.name, item.description, item.address, (item.tags || []).join(', ')]
      .filter(Boolean)
      .join('. ');

    const embedding = await embed(text);

    const { error } = await supabase.from('resources').insert({
      type: item.type ?? null,
      name: item.name,
      description: item.description ?? null,
      address: item.address ?? null,
      phone: item.phone ?? null,
      website: item.website ?? null,
      tags: item.tags ?? null,
      embedding,
    });
    if (error) {
      console.error(`Failed to insert "${item.name}":`, error.message);
      continue;
    }

    done += 1;
    if (done % 25 === 0) console.log(`${done}/${items.length}...`);
  }

  console.log(`Done. Inserted ${done}/${items.length} records.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
