const http = require('http');
const fs = require('fs');
const path = require('path');

// minimal .env loader (no dependencies)
try {
  const envText = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envText.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
} catch (e) { /* no .env — use real environment */}

const geminiHandler = require('./api/gemini');
const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/api/gemini' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      try { req.body = JSON.parse(body || '{}'); } catch (e) { req.body = {}; }
      geminiHandler(req, res);
    });
    return;
  }
  if (p === '/') p = '/index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root) || path.basename(file).charAt(0) === '.' || p.indexOf('/api/') === 0) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('http://localhost:' + PORT));
