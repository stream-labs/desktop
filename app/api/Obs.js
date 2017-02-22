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

  sourceProperties(sourceName, sourceId) {
    const properties = nodeObs.OBS_content_getSourceProperties(sourceName);

    return _.map(properties, prop => {
      let propertyObj = {
        sourceId: sourceId,
        name: prop.name,
        description: prop.description,
        longDescription: prop.long_description,
        type: prop.type,
        visible: (prop.visible === 'true'),
        enabled: (prop.enabled === 'true')
      };

      // For list types, we must separately fetch the
      // list options.
      if (propertyObj.type === 'OBS_PROPERTY_LIST') {
        propertyObj.options = _.compact(nodeObs.
          OBS_content_getSourcePropertiesSubParameters(sourceName, propertyObj.name));
      }

      propertyObj.value = this.getPropertyValue(sourceName, propertyObj);

      return propertyObj;
    });
  }

  getPropertyValue(sourceName, property) {
    let value = nodeObs.OBS_content_getSourcePropertyCurrentValue(
      sourceName,
      property.name
    );

    // If this is a simple value, there's no need to keep it
    // as an object
    if (value.value) {
      value = value.value;
    }

    // All of these values come back as strings for now, so
    // we need to do some basic type coersion.

    if (property.type === 'OBS_PROPERTY_BOOL') {
      value = value === 'true';
    }

    if (property.type === 'OBS_PROPERTY_FLOAT') {
      value = parseFloat(value);
    }

    if (property.type === 'OBS_PROPERTY_INT') {
      value = parseInt(value);
    }

    if (property.type === 'OBS_PROPERTY_FRAME_RATE') {
      value.numerator = parseInt(value.numerator);
      value.denominator = parseInt(value.denominator);

      _.each(value.ranges, range => {
        range.max.numerator = parseInt(range.max.numerator);
        range.max.denominator = parseInt(range.max.denominator);
        range.min.numerator = parseInt(range.min.numerator);
        range.min.denominator = parseInt(range.min.denominator);
      });
    }

    return value;
  }

  setProperty(sourceName, propertyName, value) {
    let valueObj;

    if (typeof(value) !== 'object') {
      valueObj = {
        value: value.toString()
      };
    }

    nodeObs.OBS_content_setProperty(
      sourceName,
      propertyName,
      valueObj || value
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

  startRecording() {
    nodeObs.OBS_service_startRecording();
  }

  stopRecording() {
    nodeObs.OBS_service_stopRecording();
  }

}

export default new ObsApi();
