// This class provides the "glue" between the node-obs module
// and the Vue app. This class is intended to be a singleton.

const nodeObs = window.require('node-obs');
import store from '../store';

class ObsApi {

  init() {
    this.initApi();
    this.createScene('Example Scene');
    this.createScene('Example Scene 2');
    this.createScene('Example Scene 3');
    this.createScene('Example Scene 4');
    this.createScene('Example Scene 5');
    this.createScene('Example Scene 6');
    this.createScene('Example Scene 7');
    this.createScene('Example Scene 8');
    this.createScene('Example Scene 9');
  }

  initApi() {
    console.log('OBS INITIALIZING');

    nodeObs.OBS_API_initOBS_API();
    nodeObs.OBS_API_openAllModules();
    nodeObs.OBS_API_initAllModules();
  }

  createScene(name) {
    nodeObs.OBS_content_createScene(name);
    store.commit('ADD_SCENE', name);
    this.syncStore();
  }

  // This function is designed to keep the Vuex store
  // in sync with the underlying OBS application. Calling
  // this method will update the Vuex store.
  syncStore() {
    console.log("SCENES");
    console.log(this.getScenes());
  }

  getScenes() {
    return nodeObs.OBS_content_getListCurrentScenes();
  }

  createSource(scene, sourceType, sourceName) {

  }

}

export default new ObsApi();
