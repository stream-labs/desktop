const { ipcRenderer } = window.require('electron');
const net = window.require('net');


export default {

  startStreaming(sourceName) {
    let frameLength = 1382400
    let buffer = new Uint8Array(frameLength);
    let bufferOffset = 0;

    let client = new net.Socket();

    client.on('data', function(data) {
      if ((data.length + bufferOffset) > frameLength) {
        let end = data.subarray(0, frameLength - bufferOffset);
        let start = data.subarray(frameLength - bufferOffset);
        buffer.set(start, 0);
        buffer.set(end, bufferOffset);
      } else {
        buffer.set(data, bufferOffset);
      }

      bufferOffset = (bufferOffset + data.length) % frameLength;
    });

    client.connect(8090, '127.0.0.1');

    return buffer;
  },

  stopStreaming() {
    ipcRenderer.send('stopStreamingSource');
  }

};
