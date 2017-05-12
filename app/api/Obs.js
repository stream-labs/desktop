// This class provides the "glue" between the node-obs module
// and the Vue app. This class is intended to be a singleton.

const { ipcRenderer, remote } = window.require('electron');

import _ from 'lodash';

let idCounter = 0;
const callbacks = {};

// Behaves just like the node-obs library, but proxies
// all methods via the main process
const nodeObs = new Proxy({}, {
  get(target, key) {
    return (...args) => {
      const mappedArgs = args.map(arg => {
        if (typeof arg === 'function') {
          idCounter += 1;

          callbacks[idCounter] = arg;

          return {
            __obsCallback: true,
            id: idCounter
          };
        }

        return arg;
      });

      return ipcRenderer.sendSync('obs-apiCall', {
        method: key,
        args: mappedArgs,
      });
    };
  }
});

ipcRenderer.on('obs-apiCallback', (event, cbInfo) => {
  callbacks[cbInfo.id](...cbInfo.args);
});

class ObsApi {

  constructor() {
    this.nodeObs = nodeObs;
  }

  isObsInstalled() {
    return nodeObs.OBS_API_isOBS_installed();
  }

  createDisplay(key) {
    nodeObs.OBS_content_createDisplay(
      remote.getCurrentWindow().getNativeWindowHandle(),
      key
    );
  }

  destroyDisplay(key) {
    nodeObs.OBS_content_destroyDisplay(key);
  }

  resizeDisplay(key, width, height) {
    nodeObs.OBS_content_resizeDisplay(key, width, height);
  }

  moveDisplay(key, x, y) {
    nodeObs.OBS_content_moveDisplay(key, x, y);
  }

  getDisplayOutputRegion(key) {
    const position = nodeObs.OBS_content_getDisplayPreviewOffset(key);
    const size = nodeObs.OBS_content_getDisplayPreviewSize(key);

    return {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height
    };
  }

  availableSources() {
    return nodeObs.OBS_content_getListInputSources();
  }

  createSourceDisplay(sourceName, key) {
    return nodeObs.OBS_content_createSourcePreviewDisplay(
      remote.getCurrentWindow().getNativeWindowHandle(),
      sourceName,
      key
    );
  }

  removeSourceDisplay(key) {
    nodeObs.OBS_content_destroyDisplay(key);
  }

  selectSource(x, y) {
    nodeObs.OBS_content_selectSource(x, y);
  }

  dragSelectedSource(x, y) {
    nodeObs.OBS_content_dragSelectedSource(x, y);
  }

  startStreaming() {
    nodeObs.OBS_service_startStreaming();
  }

  stopStreaming() {
    nodeObs.OBS_service_stopStreaming();
  }

  checkStream() {
    return nodeObs.OBS_service_isStreamingOutputActive() === '1';
  }

  startRecording() {
    nodeObs.OBS_service_startRecording();
  }

  stopRecording() {
    nodeObs.OBS_service_stopRecording();
  }

  getSourceFrameSettings(sourceName) {
    let settings = nodeObs.OBS_content_getSourceFrameSettings(sourceName);

    return {
      format: settings.format,
      width: parseInt(settings.width),
      height: parseInt(settings.height)
    };
  }

  // Needs to be called when the stream key changes
  resetService() {
    nodeObs.OBS_service_createService();
    nodeObs.OBS_service_setServiceToTheStreamingOutput();
  }

  loadConfig(path) {
    nodeObs.OBS_content_loadConfigFile(path);
  }

  saveConfig(path) {
    nodeObs.OBS_content_saveIntoConfigFile(path);
  }

  getPerformanceStatistics() {
    return nodeObs.OBS_API_getPerformanceStatistics();
  }


  // region SceneTransitions

  getSceneTransitionTypes() {
    return nodeObs.OBS_content_getListTransitions();
  }

  getSceneTransitionNames() {
    return nodeObs.OBS_content_getListCurrentTransitions();
  }

  getSceneTransitionName() {
    return nodeObs.OBS_content_getCurrentTransition();
  }

  setSceneTransitionName(name) {
    nodeObs.OBS_content_setTransition(name);
  }

  getSceneTransitionDuration() {
    return nodeObs.OBS_content_getTransitionDuration();
  }

  setSceneTransitionDuration(duration) {
    nodeObs.OBS_content_setTransitionDuration(duration);
  }

  setSceneTransitionProperty(transitionName, propName, value) {
    nodeObs.OBS_content_setTransitionProperty(transitionName, propName, { value });
  }

  addSceneTransition(transitionType, transitionName) {
    nodeObs.OBS_content_addTransition(transitionType, transitionName);
  }

  removeSceneTransition(transitionName) {
    nodeObs.OBS_content_removeTransition(transitionName);
  }

  getSceneTransitionProperties(transitionName) {
    return nodeObs.OBS_content_getTransitionProperties(transitionName);
  }

  getSceneTransitionPropertySubParameters(transitionName, propertyName) {
    return nodeObs.OBS_content_getTransitionPropertiesSubParameters(transitionName, propertyName);
  }

  // endregion


  getObsProfiles() {
    return nodeObs.OBS_API_getOBS_existingProfiles();
  }

  getObsSceneCollections() {
    return nodeObs.OBS_API_getOBS_existingSceneCollections();
  }
}

export default new ObsApi();
