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

    const lineName = $('h1').first().text().trim() || null;
    const updatedAt = $('.mainContents time').text().trim() || $('p:contains("更新")').first().text().trim() || null;
    const statusEl = $('.mainContents').find('p').filter((i, el) =>
      $(el).text().includes('平常運転') ||
      $(el).text().includes('遅延') ||
      $(el).text().includes('運転見合わせ')
    ).first();
    const status = statusEl.text().trim() || null;
    const statusDetail = $('.mainContents').find('p').filter((i, el) =>
      $(el).text().includes('情報はありません') ||
      $(el).text().includes('遅延が発生') ||
      $(el).text().includes('運転見合わせ')
    ).first().text().trim() || null;

    const missingFields = [];
    if (!lineName) missingFields.push('line');
    if (!status) missingFields.push('status');
    if (!statusDetail) missingFields.push('detail');

    if (missingFields.length > 0) {
      return res.status(422).json({
        error: 'Failed to parse required fields from Yahoo Transit HTML',
        missingFields,
        source: 'https://transit.yahoo.co.jp/diainfo/77/0'
      });
    }

    return res.status(200).json({
      line: lineName,
      status,
      detail: statusDetail,
      updatedAt,
      source: 'https://transit.yahoo.co.jp/diainfo/77/0'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
