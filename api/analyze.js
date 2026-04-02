export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Extract prompts
  const { prompt, systemPrompt } = req.body;
  if (!prompt || !systemPrompt) {
    return res.status(400).json({ error: 'Missing prompt or systemPrompt' });
  }

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in environment variables.' });
  }

  try {
    // Call Gemini API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt + '\n\nUSER REQUEST:\n' + prompt }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 4000,
            temperature: 0.3
          }
        })
      }
    );

    // Parse response
    const data = await geminiRes.json();

    // Handle API errors
    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({
        error: data?.error?.message || 'Gemini API error'
      });
    }

    // Safely extract text
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    return res.status(200).json({ text });

  } catch (err) {
    console.error("FULL ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
