export default function handler(req, res) {
  res.status(200).json({
    name: 'denshainfo API',
    description: 'Japan train operation status API',
    endpoints: [
      {
        path: '/api',
        method: 'GET',
        description: '東武スカイツリーライン (Tobu Skytree Line) - operation status scraped from Yahoo Transit'
      }
    ]
  });
}
