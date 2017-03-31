const net = window.require('net');
const { ipcRenderer, remote } = window.require('electron');

const production = remote.process.env.NODE_ENV === 'production';

const boost = window.require(production ? '../../node-boost' : './node-boost');

import SourceFrame from './SourceFrame.js';
import _ from 'lodash';
import store from '../store';

// ToDo: These two functions seem to fix the this object disappearing in a method call.
function handleListenerReacquireWrapper(obj, event, id, bufferName) {
  obj.handleListenerReacquire(event, parseInt(id), bufferName);
}

function handleListenerResize(obj, event, id) {
  obj.handleListenerResize(event, parseInt(id));
}

function handleListenerFlipWrapper(obj, event, id) {
  obj.handleListenerFlip(event, parseInt(id));
}

class SourceFrameStream {

  constructor() {
    // Object for keeping track of active streams.
    // Keyed by source id
    this.sourceStreams = {};
  }

  /*                         *
   * Public PubSub Interface *
   *                         */

  // Subscribe to frames for a particular source.
  // A subscribed id will be returned, which can be
  // used to unsubscribe.
  subscribe(sourceId, callback) {
    sourceId = parseInt(sourceId); // toDo: We get the sourceId as a string for an unknown reason.

    if (!this.sourceStreams[sourceId]) {
      this.sourceStreams[sourceId] = {
        subscribers: new Map(),
        memory: null,
        region: null,
        data: null,
        localBuffer: null
      }
    }

    let subscriberId = _.uniqueId();
    let stream = this.sourceStreams[sourceId];

    // IPC Signal
    ipcRenderer.send('listenerRegister', sourceId, store.state.sources.sources[sourceId].name);
    ipcRenderer.on('listenerReacquire', (event, id, bufferName) => {
      handleListenerReacquireWrapper(this, event, id, bufferName);
    });
    ipcRenderer.on('listenerResize', (event, id) => {
      handleListenerResize(this, event, id);
    });
    ipcRenderer.on('listenerFlip', (event, id) => {
      handleListenerFlipWrapper(this, event, id);
    });

    stream.subscribers.set(subscriberId, callback);
    return subscriberId;
  }

  // sourceId isn't technically required, but it makes
  // it faster/easier to find their subscriber id
  unsubscribe(sourceId, subscriberId) {
    sourceId = parseInt(sourceId); // toDo: We get the sourceId as a string for an unknown reason.

    let stream = this.sourceStreams[sourceId];

    // IPC Signal
    ipcRenderer.send('listenerUnregister', sourceId);

    stream.subscribers.delete(subscriberId);
  }

  /*         *
   * PRIVATE *
   *         */

  handleListenerReacquire(event, id, bufferName) {
    let stream = this.sourceStreams[id];

    try {
      let newMemory = new boost.interprocess.shared_memory(bufferName, 0, boost.interprocess.shared_memory_flags.Open + boost.interprocess.shared_memory_flags.Write);
      let newRegion = new boost.interprocess.mapped_region(newMemory);
      let newData = new SourceFrame(newRegion.buffer());
      if (newData.id !== id) {
        console.error(`listenerReacquire: Id mismatch (${id}:${typeof (id)}) !== (${newData.id}:${typeof (newData.id)}).`, newData);
        return;
      }
      console.debug(`listenerReacquire: (${id}:${typeof (id)}) reacquired '${bufferName}': ${newData.width}x${newData.height}, ${newData.size} bytes, ${newData.format} format.`);

      // Temporary Fix: WebGL crashes due to reading old buffer...
      stream.localBuffer = new Uint8Array(newData.size);
      store.dispatch({
        type: 'setSourceSize',
        sourceId: newData.id,
        width: newData.width,
        height: newData.height
      });

      stream.data = newData;
      stream.region = newRegion;
      stream.memory = newMemory;
    } catch (exc) {
      console.error(exc);
      return;
    }
  }

  handleListenerResize(event, id) {
    let stream = this.sourceStreams[id];

    store.dispatch({
      type: 'setSourceSize',
      sourceId: stream.data.id,
      width: stream.data.width,
      height: stream.data.height
    });
  }

  handleListenerFlip(event, id) {
    let stream = this.sourceStreams[id];
    if ((stream === undefined) || (stream === null) || (stream.data === null) || (stream.memory === null) || (stream.localBuffer === null)) {
      console.error(`'listenerFlip: (${id}:${typeof (id)}) received flip command with no valid stream or buffer.`);
      return;
    }
    
    // Temporary Fix: WebGL crashes due to reading old buffer...
    stream.localBuffer.set(stream.data.frontBuffer())
    stream.subscribers.forEach((value, key, map) => {
      value({
        width: stream.data.width,
        height: stream.data.height,
        format: stream.data.format,
        frameBuffer: stream.localBuffer
      });
    });
  }
}

// This class is a singleton
export default new SourceFrameStream();
