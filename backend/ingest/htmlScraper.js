const axios = require('axios');
const cheerio = require('cheerio');

async function fetchHtml(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(res.data);
    // Very basic extraction
    const title = $('meta[property="og:title"]').attr('content') || $('title').text();
    const desc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    // attempt to find article publish time
    const pub = $('meta[property="article:published_time"]').attr('content') || $('time').attr('datetime') || null;

    return {
      title: title && title.trim(),
      summary: desc && desc.trim(),
      published_at: pub,
    };
  } catch (err) {
    console.warn('HTML fetch failed', url, err.message);
    return {};
  }
}

module.exports = { fetchHtml };
