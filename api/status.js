export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const apiKey = process.env.LUMA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Generation ID is required' });
    }

    const response = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Status check failed: ${response.status}` 
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: error.message });
  }
}
