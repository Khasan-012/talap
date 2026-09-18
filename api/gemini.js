// Vercel serverless function + local backend handler.
// Reads the Gemini key ONLY from the server environment (process.env),
// never from the client. POST {model, prompt} -> Google JSON passthrough.
const ALLOWED = ['gemini-3.6-flash', 'gemma-4-31b-it'];

module.exports = async function (req, res) {
  function send(code, obj) {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj));
  }
  try {
    const key = process.env.GEMINI_KEY;
    if (!key) { send(500, { error: 'server key missing' }); return; }
    const b = req.body || {};
    const model = ALLOWED.indexOf(b.model) !== -1 ? b.model : ALLOWED[0];
    const prompt = String(b.prompt || '').slice(0, 12000);
    if (!prompt) { send(400, { error: 'empty prompt' }); return; }
    const r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, responseMimeType: 'application/json' }
        })
      }
    );
    const data = await r.text();
    res.writeHead(r.status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(data);
  } catch (e) {
    send(500, { error: 'proxy fail' });
  }
};
