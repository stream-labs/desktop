// This class provides the "glue" between the node-obs module
// and the Vue app. This class is intended to be a singleton.

const { ipcRenderer } = window.require('electron');

// Behaves just like the node-obs library, but proxies
// all methods via the main process
const nodeObs = new Proxy({}, {
  get(target, key) {
    return function() {
      return ipcRenderer.sendSync('obs-apiCall', {
        method: key,
        args: Array.from(arguments)
      });
    };
  }
});

class ObsApi {

  constructor() {
    this.nodeObs = nodeObs;
  }

  createScene(name) {
    nodeObs.OBS_content_createScene(name);
  }

  removeScene(name) {
    nodeObs.OBS_content_removeScene(name);
  }

  getScenes() {
    return nodeObs.OBS_content_getListCurrentScenes();
  }

  createSource(sceneName, sourceType, sourceName, settings, hotkeyData) {
    nodeObs.OBS_content_addSource(
      sourceType,
      sourceName,
      settings,
      hotkeyData,
      sceneName
    );
  }

  removeSource(sourceName) {
    nodeObs.OBS_content_removeSource(
      sourceName
    );
  }

  availableSources() {
    return nodeObs.OBS_content_getListInputSources();
  }

  startStreaming() {
    nodeObs.OBS_service_startStreaming();
  }

  stopStreaming() {
    nodeObs.OBS_service_stopStreaming();
  }

}

export default new ObsApi();
