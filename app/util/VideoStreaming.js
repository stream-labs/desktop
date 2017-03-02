const { ipcRenderer } = window.require('electron');



export default {

  startStreaming(sourceName, fun) {
    ipcRenderer.on('sourceFrame', (event, buf) => {
      fun(buf);
    });

    ipcRenderer.send('startStreamingSource', {
      sourceName: sourceName
    });
  },

  stopStreaming() {
    ipcRenderer.send('stopStreamingSource');
  }

};
