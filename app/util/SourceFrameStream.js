const net = window.require('net');
const { ipcRenderer } = window.require('electron');

class SourceFrameStream {

  constructor() {
    this.sources = {};
    this.idCounter = 0;
    this.currentOffset = 0;
    this.currentSource;
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

  // Handles a single chunk in a continuous stream of
  // interleaved source frames. Is responsible for making
  // sure each incoming frame gets written to the correct
  // buffer.
  handleChunk(chunk) {
    // We are expecting a header
    if (!this.currentSource) {
      // Prepare to read the incoming source frame specified
      // by the source id in the 1 byte header
      this.currentSource = this.sources[chunk[0]];
      this.currentOffset = 0;

      if (chunk.length > 1) {
        this.handleChunk(chunk.subarray(1));
      }
    } else {
      if ((chunk.length + this.currentOffset) >= this.currentSource.frameLength) {
        // Split the chunk at the frame boundary
        let finalChunk = chunk.subarray(0, this.currentSource.frameLength - this.currentOffset);
        let chunkRemainder = chunk.subarray(this.currentSource.frameLength - this.currentOffset);

        // Write the final chunk of this frame
        this.currentSource.frameBuffer.set(finalChunk, this.currentOffset);

        this.currentSource.callback();

        // Prepare to receive another header
        this.currentSource = null;

        this.handleChunk(chunkRemainder);
      } else {
        this.currentSource.frameBuffer.set(chunk, this.currentOffset);
        this.currentOffset += chunk.length;
      }
    }
  }

  subscribeToSource(sourceName, frameLength, callback) {
    this.ensureConnected();

    let frameBuffer = new Uint8Array(frameLength);

    this.sources[this.idCounter] = {
      name: sourceName,
      frameLength,
      frameBuffer,
      callback
    };

    ipcRenderer.send('subscribeToSource', {
      name: sourceName,
      id: this.idCounter
    });

    this.idCounter += 1;

    return frameBuffer;
  }
}

// This class is a singleton
export default new SourceFrameStream();
