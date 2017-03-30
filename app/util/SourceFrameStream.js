const net = window.require('net');
const { ipcRenderer } = window.require('electron');
const boost = window.require('node-boost');

import SourceFrame from './SourceFrame.js';
import _ from 'lodash';
import store from '../store';

function handleListenerReacquire(p_obj, p_event, p_id, p_bufferName) {
  p_obj.handleListenerReacquire(p_event, p_id, p_bufferName);
}

function handleListenerFlip(p_obj, p_event, p_id) {
  p_obj.handleListenerFlip(p_event, p_id);
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
    if (!this.sourceStreams[sourceId]) {
      this.sourceStreams[sourceId] = {
        subscribers: new Map(),
        memory: null,
        region: null,
        data: null
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
    // ToDo: sourceId is undefined?
    console.log(sourceId);

    let stream = this.sourceStreams[sourceId];

    // IPC Signal
    ipcRenderer.send('listenerUnregister', sourceId);

    stream.subscribers.delete(subscriberId);
  }

  /*         *
   * PRIVATE *
   *         */

  handleListenerReacquire(p_event, p_id, p_bufferName) {
    console.log('listenerReacquire', p_id)
    let stream = this.sourceStreams[p_id];

    try {
      stream.memory = new boost.interprocess.shared_memory(p_bufferName, 0, boost.interprocess.shared_memory_flags.Open);
      stream.region = new boost.interprocess.mapped_region(stream.memory);
      stream.data = new SourceFrame(stream.region.buffer());
    } catch (exc) {
      console.error(exc);
      return;
    }

    console.log(stream.data);
  }

  handleListenerFlip(p_event, p_id) {
    console.log('listenerFlip', p_id)
    let stream = this.sourceStreams[p_id];
    stream.subscribers.forEach((p_value, p_key, p_map) => {
      p_value({
        width: stream.data.width,
        height: stream.data.height,
        format: stream.data.format,
        frameBuffer: stream.data.front_buffer()
      });
    });
  }
}

// This class is a singleton
export default new SourceFrameStream();
