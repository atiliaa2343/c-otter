const Parser = require('rss-parser');
const parser = new Parser();

async function fetchRss(url) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map((i) => ({
      title: i.title,
      url: i.link || i.guid,
      summary: i.contentSnippet || i.content || i.summary,
      published_at: i.isoDate || i.pubDate,
      source: (feed.title || '').substring(0, 100),
      tags: i.categories || [],
    }));
  } catch (err) {
    console.warn('RSS fetch failed', url, err.message);
    return [];
  }
}

module.exports = { fetchRss };
