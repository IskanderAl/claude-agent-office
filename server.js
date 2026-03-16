#!/usr/bin/env node
// Simple static server with NO caching (for real-time events.json polling)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.css':  'text/css',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

http.createServer((req, res) => {
  let url = req.url.split('?')[0];  // strip query params
  if (url === '/') url = '/index.html';

  const filePath = path.join(ROOT, url);

  // Security: prevent path traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`🏢 Claude Office server running at http://localhost:${PORT}`);
  console.log(`   Serving: ${ROOT}`);
  console.log(`   Cache: DISABLED (real-time mode)`);
});
