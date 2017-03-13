const net = window.require('net');
const { ipcRenderer } = window.require('electron');

const SourceFrameHeader = require('./SourceFrameHeader.js').default;

class SourceFrameStream {

  constructor() {
    this.sources = {};
    this.idCounter = 1;
    this.header = new SourceFrameHeader();

    // This is the buffer we are currently trying to fill
    // from the TCP socket.
    this.currentBuffer = this.header.buffer;

    this.currentOffset = 0;
  }

  ensureConnected() {
    if (!this.connected) {
      this.connected = true;

      let socket = new net.Socket();

      socket.on('data', chunk => {
        this.handleChunk(chunk);
      });

      socket.connect(8090, '127.0.0.1');
    }
  }

  // Sets up the next target buffer for streaming.
  setNextTarget() {
    if (this.currentSourceId) {
      this.currentSourceId = null;
      this.currentBuffer = this.header.buffer;
    } else {
      this.currentSourceId = this.header.id;
      let source = this.sources[this.header.id];

      if (!source.frameBuffer || (source.frameBuffer.length !== this.header.frameLength)) {
        source.frameBuffer = new Uint8Array(this.header.frameLength);
      }

      this.currentBuffer = source.frameBuffer;
    }

    this.currentOffset = 0;
  }

  processBuffer() {
    if (this.currentSourceId) {
      let source = this.sources[this.currentSourceId];

      source.callback({
        width: this.header.width,
        height: this.header.height,
        frameBuffer: source.frameBuffer
      });
    }
  }

  handleChunk(chunk) {
    // console.log("CHUNK", chunk.length);

    if ((chunk.length + this.currentOffset) >= this.currentBuffer.length) {
      let boundary = this.currentBuffer.length - this.currentOffset;

      let finalChunk = chunk.subarray(0, boundary);
      let overflow = chunk.subarray(boundary);

      this.currentBuffer.set(finalChunk, this.currentOffset);

      this.processBuffer();
      this.setNextTarget();

      this.handleChunk(overflow);
    } else {
      this.currentBuffer.set(chunk, this.currentOffset);
      this.currentOffset += chunk.length;
    }
  }

  subscribeToSource(sourceName, callback) {
    this.ensureConnected();

    this.sources[this.idCounter] = {
      name: sourceName,
      callback
    };

    ipcRenderer.send('subscribeToSource', {
      name: sourceName,
      id: this.idCounter
    });

    this.idCounter += 1;
  }
}

// This class is a singleton
export default new SourceFrameStream();
