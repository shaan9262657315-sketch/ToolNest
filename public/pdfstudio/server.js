#!/usr/bin/env node
/**
 * Minimal zero-dependency static file server for PDF Studio.
 *
 * A server is required because browsers refuse to start the pdf.js web worker
 * from a file:// URL. Run `npm start` and open the printed address.
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;

const argPort = (() => {
  const i = process.argv.indexOf('--port');
  return i !== -1 ? Number(process.argv[i + 1]) : NaN;
})();
const PORT = Number(process.env.PORT) || argPort || 5173;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
};

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }

  if (pathname === '/') pathname = '/index.html';

  // Resolve inside ROOT and reject anything that escapes it.
  const target = path.resolve(ROOT, '.' + pathname);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(target, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(target).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  PDF Studio  ->  http://localhost:' + PORT);
  console.log('  Serving     ->  ' + ROOT);
  console.log('  Everything runs in your browser. No file ever leaves this machine.');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try: npm start -- --port 5174`);
    process.exit(1);
  }
  throw err;
});
