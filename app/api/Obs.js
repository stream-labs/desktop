// This class provides the "glue" between the node-obs module
// and the Vue app. This class is intended to be a singleton.

const nodeObs = window.require('node-obs');

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

}

export default new ObsApi();
