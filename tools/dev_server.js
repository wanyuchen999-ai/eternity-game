/* 本地预览服务器（开发辅助，非游戏运行必需）
 * 用法：node tools/dev_server.js   然后访问 http://127.0.0.1:8123/
 * 说明：游戏本身支持直接双击 index.html 离线运行，此服务器仅用于局域网预览/调试。 */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = process.env.PORT || 8123;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".webp": "image/webp",
  ".wav":  "audio/wav",
  ".mp3":  "audio/mpeg",
  ".ogg":  "audio/ogg",
  ".json": "application/json; charset=utf-8",
  ".ico":  "image/x-icon",
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT)){ res.writeHead(403); return res.end("403"); }
  fs.readFile(file, (err, data) => {
    if (err){ res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("404 Not Found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, () => console.log("预览服务已启动: http://127.0.0.1:" + PORT + "/"));
