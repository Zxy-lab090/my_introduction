/* =========================================================
   极简本地预览服务器（零依赖，只用 Node 内置模块）
   用法：  node serve.js            默认 http://127.0.0.1:5188
          node serve.js 3000       指定端口
   只用于本地预览，不要拿它当线上服务器。
   ========================================================= */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 5188;
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, `http://${HOST}`).pathname);
  } catch {
    res.writeHead(400).end('Bad Request');
    return;
  }

  if (urlPath.endsWith('/')) urlPath += 'index.html';

  // 防目录穿越：解析后必须仍在 ROOT 内
  const filePath = path.resolve(ROOT, '.' + urlPath);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404</h1><p>找不到这个文件。</p>');
      return;
    }

    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`本地预览已启动： http://${HOST}:${PORT}/`);
  console.log('按 Ctrl+C 停止。');
});
