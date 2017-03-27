const net = window.require('net');
const { ipcRenderer } = window.require('electron');

import SourceFrameHeader from './SourceFrameHeader.js';
import _ from 'lodash';
import store from '../store';

class SourceFrameStream {

  constructor() {
    // Object for keeping track of active streams.
    // Keyed by source id
    this.sourceStreams = {};

    // All headers will be read into this buffer
    this.header = new SourceFrameHeader();

    // This is the buffer we are currently trying to fill
    // from the TCP socket.
    this.currentBuffer = this.header.buffer;

    // This represents how far into the current buffer
    // we are.
    this.currentOffset = 0;
  }

  /*                         *
   * Public PubSub Interface *
   *                         */

  // Subscribe to frames for a particular source.
  // A subscribed id will be returned, which can be
  // used to unsubscribe.
  subscribe(sourceId, callback) {
    // Ensure we are connected to the main process
    this.ensureSocketConnection();

    // Ensure we are streaming the requested source
    this.ensureSourceStream(sourceId);

    let subscriberId = _.uniqueId();
    let stream = this.sourceStreams[sourceId];

    stream.subscribers[subscriberId] = callback;

    return subscriberId;
  }

  // sourceId isn't technically required, but it makes
  // it faster/easier to find their subscriber id
  unsubscribe(sourceId, subscriberId) {
    let stream = this.sourceStreams[sourceId];

    delete stream.subscribers[subscriberId];

    // TODO: We may want to unsubscribe from frames entirely
    // once the last subscriber has unsubscribed.
  }

  /*         *
   * PRIVATE *
   *         */

  // The socket is started lazily
  ensureSocketConnection() {
    if (!this.connected) {
      this.connected = true;

      let socket = new net.Socket();

      socket.on('data', chunk => {
        this.handleChunk(chunk);
      });

      socket.connect(ipcRenderer.sendSync('getSocketPath'));
    }
  }

  // Streams for each source are started lazily
  ensureSourceStream(sourceId) {
    if (!this.sourceStreams[sourceId]) {
      this.sourceStreams[sourceId] = {
        subscribers: {},
        frameBuffer: null
      };

      let sourceName = store.state.sources.sources[sourceId].name;

      ipcRenderer.send('subscribeToSource', {
        name: sourceName,
        id: sourceId
      });
    }
  }

  processBuffer() {
    // If we just processed a source frame
    if (this.currentSourceId) {
      let stream = this.sourceStreams[this.currentSourceId];

      _.each(stream.subscribers, callback => {
        _.defer(callback, {
          width: this.header.width,
          height: this.header.height,
          format: this.header.format,
          frameBuffer: stream.frameBuffer
        });
      });

      this.currentSourceId = null;
      this.currentBuffer = this.header.buffer;

    // Otherwise we processed a header
    } else {
      this.currentSourceId = this.header.id.toString();
      let stream = this.sourceStreams[this.currentSourceId];

      // If the frame buffer does not exist yet, or is not correctly
      // sized for the incoming frame, allocate a new framebuffer
      if (!stream.frameBuffer || (stream.frameBuffer.length !== this.header.frameLength)) {
        stream.frameBuffer = new Uint8Array(this.header.frameLength);
      }

      this.currentBuffer = stream.frameBuffer;

      let source = store.state.sources.sources[this.currentSourceId];

      // If the width of the incoming frame is different,
      // let the vuex store know about the new source size.
      if ((source.width !== this.header.width) || source.height !== this.header.height) {
        store.dispatch({
          type: 'setSourceSize',
          sourceId: source.id,
          width: this.header.width,
          height: this.header.height
        });
      }
    }

    this.currentOffset = 0;
  }

  handleChunk(chunk) {
    if ((chunk.length + this.currentOffset) >= this.currentBuffer.length) {
      let boundary = this.currentBuffer.length - this.currentOffset;

      let finalChunk = chunk.subarray(0, boundary);
      let overflow = chunk.subarray(boundary);

      this.currentBuffer.set(finalChunk, this.currentOffset);

      this.processBuffer();

      this.handleChunk(overflow);
    } else {
      this.currentBuffer.set(chunk, this.currentOffset);
      this.currentOffset += chunk.length;
    }
  }
}

// This class is a singleton
export default new SourceFrameStream();
