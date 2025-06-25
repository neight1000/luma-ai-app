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
    console.log('Using API key:', apiKey.substring(0, 10) + '...');

    // Updated request body format for Luma AI
    const requestBody = {
      prompt: prompt.trim(),
      aspect_ratio: aspect_ratio,
      model: "ray-2"
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);

    if (!response.ok) {
      // Try to parse error details
      let errorDetails = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorDetails = errorJson.detail || errorJson.error || errorJson.message || responseText;
      } catch (parseError) {
        // Use raw response text
      }

      console.error('Luma API Error:', response.status, errorDetails);
      
      if (response.status === 400) {
        return res.status(400).json({ 
          error: `Bad Request: ${errorDetails}`,
          details: 'Check if your prompt is valid and API key is correct'
        });
      } else if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid API key' });
      } else if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
      
      return res.status(response.status).json({ 
        error: `Luma API Error: ${response.status}`,
        details: errorDetails
      });
    }

    const data = JSON.parse(responseText);
    console.log('Generation created successfully:', data.id);

    res.json({
      id: data.id,
      state: data.state || 'queued',
      created_at: data.created_at
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Internal server error'
    });
  }
}
