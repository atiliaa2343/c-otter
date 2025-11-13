const fs = require('fs');
const path = require('path');
const { fetchRss } = require('./rssFetcher');
const { fetchHtml } = require('./htmlScraper');

const DATA_PATH = path.join(__dirname, '..', 'sample_data.json');

// Small seed list per domain. Expand as needed.
const SEEDS = {
  'mental-health': [
    'https://www.nimh.nih.gov/news-events/rss.xml',
    'https://www.psychologytoday.com/us/rss',
    'https://www.psychology.org/rss.xml',
    'https://www.psychiatry.org/rss.xml',
  ],
  'vaccines': [
    'https://www.cdc.gov/vaccines/rss.xml',
    'https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml',
  ],
  'general-health': [
    'https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml',
    'https://www.health.harvard.edu/blog/rss',
    'https://www.medicalnewstoday.com/rss',
    'https://www.webmd.com/rss/2/most-popular',
  ],
  'fitness': [
    'https://www.runnersworld.com/rss/all.xml',
    'https://www.menshealth.com/rss/all.xml',
  ],
  'nutrition': [
    'https://www.eatright.org/news/rss',
    'https://www.nutrition.org/rss.xml',
  ],
  'addiction-recovery': [
    'https://www.samhsa.gov/newsroom/rss.xml',
    'https://www.addictioncenter.com/feed/',
  ],
};

function loadStore() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function saveStore(items) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), 'utf8');
}

function normalizeItem(raw, domain) {
  return {
    id: raw.link || raw.url || raw.guid || Math.random().toString(36).slice(2),
    title: raw.title || raw.name || 'Untitled',
    url: raw.link || raw.url,
    source: raw.creator || raw.author || raw.source || domain,
    published_at: raw.pubDate || raw.isoDate || raw.published_at || new Date().toISOString(),
    summary: raw.contentSnippet || raw.summary || raw.description || raw.summary || '',
    domain,
    // basic heuristic: if url looks like an app store or title mentions 'app', mark as 'app'
    type: (raw.link || raw.url || '').match(/apps?\.|play\.google\.com|apps\.apple\.com/) || (String(raw.title || '').toLowerCase().includes('app')) ? 'app' : (raw.type || 'article'),
    tags: raw.categories || [],
    ingested_at: new Date().toISOString(),
  };
}

async function runAll({ domains = Object.keys(SEEDS), maxPerSource = 10 } = {}) {
  const logs = [];
  const store = loadStore();
  const byUrl = new Map(store.map((s) => [s.url, s]));

  logs.push(`Starting ingest for domains: ${domains.join(', ')}`);

  for (const domain of domains) {
    const seeds = SEEDS[domain] || [];
    logs.push(`Processing domain: ${domain} (${seeds.length} seeds)`);
    for (const seed of seeds) {
      logs.push(`  Fetching seed: ${seed}`);
      // try RSS first
      let items = [];
      try {
        items = await fetchRss(seed);
        logs.push(`    RSS: fetched ${items.length} items from ${seed}`);
      } catch (err) {
        logs.push(`    RSS fetch failed for ${seed}: ${err?.message || err}`);
      }

      if (!items || items.length === 0) {
        // fallback: try HTML scrape of the seed page
        try {
          const info = await fetchHtml(seed);
          if (info && info.title) {
            items = [ { title: info.title, link: seed, summary: info.summary, published_at: info.published_at } ];
            logs.push(`    HTML fallback: extracted 1 item from ${seed}`);
          } else {
            logs.push(`    HTML fallback: no usable content from ${seed}`);
          }
        } catch (err) {
          logs.push(`    HTML fallback failed for ${seed}: ${err?.message || err}`);
        }
      }

      items = (items || []).slice(0, maxPerSource);

      let added = 0;
      for (const raw of items) {
        const item = normalizeItem(raw, domain);
        if (!item.url) continue;

        if (byUrl.has(item.url)) {
          // update existing
          const existing = byUrl.get(item.url);
          Object.assign(existing, item);
        } else {
          byUrl.set(item.url, item);
          added++;
        }
      }
      logs.push(`    Seed summary: processed ${items.length} items, added ${added} new`);
    }
  }

  const out = Array.from(byUrl.values()).sort((a,b) => new Date(b.published_at) - new Date(a.published_at));
  saveStore(out);
  logs.push(`Ingest complete. total items: ${out.length}`);
  return { items: out, logs };
}

module.exports = { runAll };
