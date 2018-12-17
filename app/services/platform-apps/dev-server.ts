import http from 'http';
import handler from 'serve-handler';

export class DevServer {
  constructor(private directory: string, private port = 8081) {
    this.listen();
  }

  server: http.Server;

  listen() {
    this.server = http.createServer((request, response) =>
      handler(request, response, {
        public: this.directory,
        cleanUrls: false,
      }),
    );

    this.server.listen(this.port);
  }

  stopListening() {
    this.server.close();
  }
}
