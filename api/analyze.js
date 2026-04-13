export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, systemPrompt } = req.body;
  if (!prompt || !systemPrompt) return res.status(400).json({ error: 'Missing prompt or systemPrompt' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set in Vercel environment variables.' });

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + '\n\nUSER REQUEST:\n' + prompt }] }],
          generationConfig: { maxOutputTokens: 4000, temperature: 0.3 }
        })
      }
    );
    if (!geminiRes.ok) {
      const e = await geminiRes.json().catch(() => ({}));
      return res.status(geminiRes.status).json({ error: e?.error?.message || `Gemini error ${geminiRes.status}` });
    }
    const data = await geminiRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
