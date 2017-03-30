const net = window.require('net');
const { ipcRenderer } = window.require('electron');
const boost = window.require('node-boost');

import SourceFrame from './SourceFrame.js';
import _ from 'lodash';
import store from '../store';

function handleListenerReacquire(p_obj, p_event, p_id, p_bufferName) {
  p_obj.handleListenerReacquire(p_event, parseInt(p_id), p_bufferName);
}

function handleListenerFlip(p_obj, p_event, p_id) {
  p_obj.handleListenerFlip(p_event, parseInt(p_id));
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
    ipcRenderer.on('listenerReacquire', (p_event, p_id, p_bufferName) => {
      handleListenerReacquire(this, p_event, p_id, p_bufferName);
    });
    ipcRenderer.on('listenerFlip', (p_event, p_id) => {
      handleListenerFlip(this, p_event, p_id);
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

  handleListenerReacquire(p_event, p_id, p_bufferName) {
    // console.log('listenerReacquire', p_id)
    let stream = this.sourceStreams[p_id];

    try {
      let newMemory = new boost.interprocess.shared_memory(p_bufferName, 0, boost.interprocess.shared_memory_flags.Open);
      let newRegion = new boost.interprocess.mapped_region(newMemory);
      let newData = new SourceFrame(newRegion.buffer());
      if (newData.id !== p_id) {
        console.error(`listenerReacquire: Id mismatch (${p_id}:${typeof (p_id)}) !== (${newData.id}:${typeof (newData.id)}).`, newData);
        return;
      }
      console.debug(`listenerReacquire: (${p_id}:${typeof (p_id)}) reacquired '${p_bufferName}': ${newData.width}x${newData.height}, ${newData.size} bytes, ${newData.format} format.`);

      // Temporary Fix: WebGL crashes due to reading old buffer...
      stream.localbuffer = new Uint8Array(newData.size);

      // ToDo: Figure out how this even works.
      store.dispatch({
        type: 'setSourceSize',
        sourceId: newData.id,
        width: newData.width,
        height: newData.height
      });
      stream.subscribers.forEach((p_value, p_key, p_map) => {
        p_value({
          width: newData.width,
          height: newData.height,
          format: newData.format,
          frameBuffer: stream.localBuffer
        });
      });

      stream.data = newData;
      stream.region = newRegion;
      stream.memory = newMemory;
    } catch (exc) {
      console.error(exc);
      return;
    }
  }

  handleListenerFlip(p_event, p_id) {
    // console.log('listenerFlip', p_id)
    let stream = this.sourceStreams[p_id];
    if ((stream === undefined) || (stream === null) || (stream.data === null) || (stream.memory === null)) {
      console.error(`'listenerFlip: (${p_id}:${typeof (p_id)}) received flip command with no valid stream or buffer.`);
      return;
    }
    // Temporary Fix: WebGL crashes due to reading old buffer...
    stream.localBuffer.set(stream.data.front_buffer())
    
    // ToDo: Figure out how this even works.
    stream.subscribers.forEach((p_value, p_key, p_map) => {
      p_value({
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
