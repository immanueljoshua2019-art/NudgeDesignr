import { GoogleGenAI } from '@google/genai';

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { prompt, systemPrompt } = await req.json();
  if (!prompt || !systemPrompt) {
    return Response.json({ error: 'Missing prompt or systemPrompt' }, { status: 400 });
  }

  const apiKey = Netlify.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return Response.json(
      { error: 'GEMINI_API_KEY not configured. Add it in Netlify → Site configuration → Environment variables.' },
      { status: 500 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt + '\n\nUSER REQUEST:\n' + prompt,
      config: {
        maxOutputTokens: 8192,   // raised from 4000 — full JSON needs 5000-7000 tokens
        temperature: 0.3,
        thinkingConfig: { thinkingBudget: 0 }, // no thinking tokens — all budget goes to JSON output
      },
    });

    return Response.json(
      {
        candidates: [{
          content: {
            parts: [{ text: response.text }],
          },
        }],
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (err) {
    console.error('Gemini error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: '/api/analyze',
  method: ['POST', 'OPTIONS'],
};
