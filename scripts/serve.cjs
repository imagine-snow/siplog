// Dependency-free local server for the downloadable build. Bound to this device only.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname);
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webmanifest':'application/manifest+json', '.json':'application/json' };
const server = http.createServer((req, res) => {
  let name;
  try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400);res.end();return; }
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep) || !['GET','HEAD'].includes(req.method)) { res.writeHead(403);res.end();return; }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) { res.writeHead(404);res.end('Not found');return; }
    res.writeHead(200, { 'Content-Type':mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff' });
    if(req.method === 'HEAD')res.end();else fs.createReadStream(file).pipe(res);
  });
});
server.listen(4173, '127.0.0.1', () => console.log('酒迹已启动：http://localhost:4173\n保持本窗口打开。按 Ctrl+C 退出。'));
server.on('error', error => { console.error('无法启动：'+error.message); process.exitCode=1; });
