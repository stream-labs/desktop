import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.svg': 'application/image/svg+xml',
};

// Based roughly on https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework
export class DevServer {
  constructor(private directory: string, private port = 8081) {
    this.listen();
  }

  server: http.Server;

  listen() {
    this.server = http.createServer((request, response) => {
      const parsedUrl = url.parse(request.url);
      const filePath = path.join(this.directory, parsedUrl.pathname);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (error, content) => {
        if (error) {
          if (error.code === 'ENOENT') {
            response.writeHead(404);
            response.end();
          } else {
            response.writeHead(500);
            response.end();
          }
        } else {
          response.writeHead(200, { 'Content-Type': contentType });
          response.end(content, 'utf-8');
        }
      });
    });

    this.server.listen(this.port);
  }

  stopListening() {
    this.server.close();
  }
}
