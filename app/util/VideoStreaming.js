const ipc = window.require('node-ipc');

let frameSize = 1382400;
let frameBuffer = new Uint8Array(frameSize);
let bufferOffset = 0;
let cb;

ipc.config.id = 'slobsrenderer';
ipc.config.rawBuffer = true;
ipc.config.retry = 1500;
ipc.config.encoding = 'hex';

ipc.connectTo('slobs', function() {
  ipc.of.slobs.on('data', function(data) {

    if ((bufferOffset + data.length) > frameSize) {
      let start = performance.now();

      let previousFrameData = data.subarray(0, frameSize - bufferOffset);
      let nextFrameData = data.subarray(frameSize - bufferOffset);

      frameBuffer.set(previousFrameData, bufferOffset);

      cb(frameBuffer);

      frameBuffer = new Uint8Array(frameSize);
      bufferOffset = 0;

      frameBuffer.set(nextFrameData, bufferOffset);
      bufferOffset += nextFrameData.length;

      let end = performance.now();
      console.log("BOUNDARY", end - start);
    } else {
      let start = performance.now();
      frameBuffer.set(data, bufferOffset);
      bufferOffset += data.length;

      if (bufferOffset >= frameBuffer.length) {
        cb(frameBuffer);
        frameBuffer = new Uint8Array(frameSize);
        bufferOffset = 0;
      }
      let end = performance.now();
      console.log("NON BOUNDARY", end - start);
    }
  });
});

const { ipcRenderer } = window.require('electron');

export default {

  startStreaming(sourceName, fun) {
    cb = fun;

    ipcRenderer.send('startStreamingSource', {
      sourceName: sourceName
    });
  },

  stopStreaming() {
    ipcRenderer.send('stopStreamingSource');
  }

};
