// Cloudflare Worker: keeps your Anthropic API key off the website.
// 1) Create a Worker, paste this, add a secret named ANTHROPIC_API_KEY
// 2) Put the Worker URL in CHAT_API inside index.html
const ALLOW = ['https://holidayssrilanka.com', 'https://www.holidayssrilanka.com']; // add your test origin if needed

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOW.includes(origin) ? origin : ALLOW[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST' || !ALLOW.includes(origin)) return new Response('Forbidden', { status: 403, headers: cors });

    const { system, messages } = await req.json();
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5', // for even warmer, more careful answers try 'claude-sonnet-4-6'
        temperature: 0.7,
        max_tokens: 450,
        system: String(system || '').slice(0, 14000),
        messages: (messages || []).slice(-16).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 1500) })),
      }),
    });
    const j = await r.json();
    const reply = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    return new Response(JSON.stringify({ reply }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  },
};
