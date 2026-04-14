import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const response = await fetch('https://transit.yahoo.co.jp/diainfo/77/0', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en;q=0.9'
      }
    });

    if (!response.ok) {
      return res.status(502).json({
        error: 'Failed to fetch Yahoo Transit page',
        statusCode: response.status
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const lineName = $('.labelLarge h1.title').text().trim() || null;
    const reading = $('.labelLarge span.staKana').text().trim() || null;
    const updatedAt = $('.labelLarge span.subText').text().trim() || null;
    const statusEl = $('#mdServiceStatus dl dt');
    const status = statusEl.clone().children('span').remove().end().text().trim() || null;
    const detail = $('#mdServiceStatus dl dd p').text().trim() || null;

    const missingFields = [];
    if (!lineName) missingFields.push('line');
    if (!status) missingFields.push('status');
    if (!detail) missingFields.push('detail');

    if (missingFields.length > 0) {
      return res.status(422).json({
        error: 'Failed to parse required fields from Yahoo Transit HTML',
        missingFields,
        source: 'https://transit.yahoo.co.jp/diainfo/77/0'
      });
    }

    return res.status(200).json({
      line: lineName,
      reading,
      status,
      detail,
      updatedAt,
      source: 'https://transit.yahoo.co.jp/diainfo/77/0'
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
