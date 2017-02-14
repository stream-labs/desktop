// This class provides the "glue" between the node-obs module
// and the Vue app. This class is intended to be a singleton.

const { ipcRenderer } = window.require('electron');

import _ from 'lodash';

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

  createSource(sceneName, sourceType, sourceName) {
    nodeObs.OBS_content_addSource(
      sourceType,
      sourceName,
      {},
      {},
      sceneName
    );
  }

  removeSource(sourceName) {
    nodeObs.OBS_content_removeSource(
      sourceName
    );
  }

  sourceProperties(sourceName) {
    const propertyArr = nodeObs.OBS_content_getSourceProperties(sourceName);

    return _.map(_.chunk(propertyArr, 3), prop => {
      let propertyObj = {
        name: prop[0],
        description: prop[1],
        type: prop[2]
      };

      // For list types, we must separately fetch the
      // list options.
      if (propertyObj.type === 'OBS_PROPERTY_LIST') {
        propertyObj.options = nodeObs.
          OBS_content_getSourcePropertiesSubParameters(sourceName, propertyObj.name);
      }

      let value = nodeObs.OBS_content_getSourcePropertyCurrentValue(sourceName, prop[0]);

      if (propertyObj.type === 'OBS_PROPERTY_BOOL') {
        // Convert from string to boolean value
        value = value === 'true';
      }

      propertyObj.value = value;

      return propertyObj;
    });
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
