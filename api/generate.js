export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, aspect_ratio = '16:9' } = req.body;
    const apiKey = process.env.LUMA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Creating generation for:', prompt);

    const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Luma API Error:', response.status, errorText);
      
      if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid API key' });
      } else if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
      
      return res.status(response.status).json({ 
        error: `Luma API Error: ${response.status}` 
      });
    }

    const data = await response.json();
    console.log('Generation created:', data.id);

    res.json({
      id: data.id,
      state: data.state || 'queued'
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
}
