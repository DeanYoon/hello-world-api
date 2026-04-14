import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const debug = [];

  try {
    debug.push('Fetching Yahoo Transit page...');
    const response = await fetch('https://transit.yahoo.co.jp/diainfo/77/0', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en;q=0.9'
      }
    });

    debug.push(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      return res.status(502).json({
        error: 'Failed to fetch Yahoo Transit page',
        statusCode: response.status,
        debug
      });
    }

    const html = await response.text();
    debug.push(`HTML length: ${html.length} chars`);

    const $ = cheerio.load(html);

    // --- lineName: .labelLarge h1.title
    const lineNameEl = $('.labelLarge h1.title');
    const lineName = lineNameEl.text().trim() || null;
    debug.push(`[lineName] selector='.labelLarge h1.title' found=${lineNameEl.length > 0} value=${JSON.stringify(lineName)}`);

    // --- reading: .labelLarge span.staKana
    const readingEl = $('.labelLarge span.staKana');
    const reading = readingEl.text().trim() || null;
    debug.push(`[reading] selector='.labelLarge span.staKana' found=${readingEl.length > 0} value=${JSON.stringify(reading)}`);

    // --- updatedAt: .labelLarge span.subText
    const updatedAtEl = $('.labelLarge span.subText');
    const updatedAt = updatedAtEl.text().trim() || null;
    debug.push(`[updatedAt] selector='.labelLarge span.subText' found=${updatedAtEl.length > 0} value=${JSON.stringify(updatedAt)}`);

    // --- status: #mdServiceStatus dl dt (text without the icon span)
    const statusEl = $('#mdServiceStatus dl dt');
    const status = statusEl.clone().children('span').remove().end().text().trim() || null;
    debug.push(`[status] selector='#mdServiceStatus dl dt' found=${statusEl.length > 0} value=${JSON.stringify(status)}`);

    // --- detail: #mdServiceStatus dl dd p
    const detailEl = $('#mdServiceStatus dl dd p');
    const detail = detailEl.text().trim() || null;
    debug.push(`[detail] selector='#mdServiceStatus dl dd p' found=${detailEl.length > 0} value=${JSON.stringify(detail)}`);

    const missingFields = [];
    if (!lineName) missingFields.push('line');
    if (!status) missingFields.push('status');
    if (!detail) missingFields.push('detail');

    if (missingFields.length > 0) {
      debug.push(`PARSE FAILED: missingFields=${JSON.stringify(missingFields)}`);
      return res.status(422).json({
        error: 'Failed to parse required fields from Yahoo Transit HTML',
        missingFields,
        source: 'https://transit.yahoo.co.jp/diainfo/77/0',
        debug
      });
    }

    debug.push('All fields parsed successfully.');

    return res.status(200).json({
      line: lineName,
      reading,
      status,
      detail,
      updatedAt,
      source: 'https://transit.yahoo.co.jp/diainfo/77/0',
      debug
    });

  } catch (err) {
    debug.push(`EXCEPTION: ${err.message}`);
    return res.status(500).json({
      error: err.message,
      debug
    });
  }
}
