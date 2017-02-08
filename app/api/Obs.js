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

  init() {
    this.initApi();
  }

  initApi() {
    console.log('OBS INITIALIZING');

    nodeObs.OBS_API_initOBS_API();
    nodeObs.OBS_API_openAllModules();
    nodeObs.OBS_API_initAllModules();
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

  availableSources() {
    return nodeObs.OBS_content_getListInputSources();
  }

}

export default new ObsApi();
