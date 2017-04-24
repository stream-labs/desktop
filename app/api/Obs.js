// This class provides the "glue" between the node-obs module
// and the Vue app. This class is intended to be a singleton.

const { ipcRenderer, remote } = window.require('electron');

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

  createScene(name) {
    nodeObs.OBS_content_createScene(name);
  }

  removeScene(name) {
    nodeObs.OBS_content_removeScene(name);
  }

  setCurrentScene(name) {
    nodeObs.OBS_content_setCurrentScene(name);
  }

  getScenes() {
    return nodeObs.OBS_content_getListCurrentScenes();
  }

  getSourcesInScene(sceneName) {
    return nodeObs.OBS_content_getListCurrentSourcesFromScene(sceneName);
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

  // operation is one of:
  // move_up
  // move_down
  // move_top
  // move_bottom
  moveSource(sourceName, operation) {
    nodeObs.OBS_content_setSourceOrder(sourceName, operation);
  }

  sourceProperties(sourceName, sourceId) {
    const properties = nodeObs.OBS_content_getSourceProperties(sourceName);

    const parsedProperties = _.map(properties, prop => {
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

    nodeObs.OBS_content_updateSourceProperties(sourceName);

    return parsedProperties;
  }

  getPropertyValue(sourceName, property) {
    let obj = nodeObs.OBS_content_getSourcePropertyCurrentValue(
      sourceName,
      property.name
    );

    // All of these values come back as strings for now, so
    // we need to do some basic type coersion.

    if (property.type === 'OBS_PROPERTY_BOOL') {
      obj.value = obj.value === 'true';
    }

    if (property.type === 'OBS_PROPERTY_FLOAT') {
      obj.value = parseFloat(obj.value);
    }

    if (property.type === 'OBS_PROPERTY_INT') {
      obj.value = parseInt(obj.value);
    }

    if (property.type === 'OBS_PROPERTY_FRAME_RATE') {
      obj.numerator = parseInt(obj.numerator);
      obj.denominator = parseInt(obj.denominator);

      _.each(obj.ranges, range => {
        range.max.numerator = parseInt(range.max.numerator);
        range.max.denominator = parseInt(range.max.denominator);
        range.min.numerator = parseInt(range.min.numerator);
        range.min.denominator = parseInt(range.min.denominator);
      });
    }

    if (property.type === 'OBS_PROPERTY_FONT') {
      obj.style = obj.style || 'Regular';
    }

    if (property.type === 'OBS_PROPERTY_PATH') {
      obj.filter = this.parsePathFilters(obj.filter);
    }

    if (property.type === 'OBS_PROPERTY_EDITABLE_LIST') {
      obj.filter = this.parsePathFilters(obj.filter);
    }

    return obj;
  }

  parsePathFilters(filterStr) {
    let filters = _.compact(filterStr.split(';;'));

    // Browser source uses *.*
    if (filterStr === '*.*') {
      return [
        {
          name: 'All Files',
          extensions: ['*']
        }
      ];
    }

    return _.map(filters, filter => {
      let match = filter.match(/^(.*) \((.*)\)$/);
      let desc = match[1];
      let types = match[2].split(' ');

      types = _.map(types, type => {
        return type.match(/^\*\.(.+)$/)[1];
      });

      // This is the format that electron file dialogs use
      return {
        name: desc,
        extensions: types
      };
    });
  }

  setProperty(sourceName, propertyName, value) {
    nodeObs.OBS_content_setProperty(
      sourceName,
      propertyName,
      value
    );
  }

  availableSources() {
    return nodeObs.OBS_content_getListInputSources();
  }

  setSourcePosition(name, x, y) {
    nodeObs.OBS_content_setSourcePosition(name, x.toString(), y.toString());
  }

  setSourceScale(name, x, y) {
    nodeObs.OBS_content_setSourceScaling(name, x.toString(), y.toString());
  }

  // Uses a virtual node-obs function to set position and
  // scale atomically.  This is required for smooth resizing.
  setSourcePositionAndScale(name, x, y, scaleX, scaleY) {
    nodeObs.OBS_content_setSourcePositionAndScale(
      name,
      x.toString(),
      y.toString(),
      scaleX.toString(),
      scaleY.toString()
    );
  }

  getSourcePosition(name) {
    return nodeObs.OBS_content_getSourcePosition(name);
  }

  getSourceScale(name) {
    return nodeObs.OBS_content_getSourceScaling(name);
  }

  getSourceSize(name) {
    return nodeObs.OBS_content_getSourceSize(name);
  }

  setActiveSources(sourceNames) {
    const sourceArr = _.map(sourceNames, sourceName => {
      return { name: sourceName };
    });

    nodeObs.OBS_content_selectSources(sourceArr);
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

}

export default new ObsApi();
