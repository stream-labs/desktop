window['eval'] = global.eval = function () {
  throw new Error('window.eval() is disabled for security');
};

import 'reflect-metadata';
import Vue from 'vue';
import _ from 'lodash';
import URI from 'urijs';

import { createStore } from './store';
import { ObsApiService } from './services/obs-api';
import { WindowService } from './services/window';
import { StartupService } from './services/startup';
import { ServicesManager } from './services-manager';
import electron from 'electron';

const { ipcRenderer } = electron;

require('./app.less');

document.addEventListener('DOMContentLoaded', () => {
  const store = createStore();
  const windowService = WindowService.instance;
  const obsApiService = ObsApiService.instance;
  const query = URI.parseQuery(URI.parse(window.location.href).query);
  const isChild = query.child;

  if (isChild) {
    windowService.setWindowAsChild();
    windowService.setWindowOptions(_.omit(query, ['child']));

    ipcRenderer.on('closeWindow', () => {
      windowService.closeWindow();
    });
    const servicesManager: ServicesManager = ServicesManager.instance;
    servicesManager.listenMessages();
  } else {
    windowService.setWindowOptions({ component: 'Main' });
    StartupService.instance.load();
  }

  window['obs'] = obsApiService.nodeObs;

  const vm = new Vue({
    el: '#app',
    store,
    render: h => {
      const componentName = windowService.state.options.component;

      return h(windowService.components[componentName]);
    }
  });

  // Used for replacing the contents of this window with
  // a new top level component
  ipcRenderer.on('window-setContents', (event: any, options: any) => {
    windowService.setWindowOptions(options);

    // This is purely for developer convencience.  Changing the URL
    // to match the current contents, as well as pulling the options
    // from the URL, allows child windows to be refreshed without
    // losing their contents.
    const newOptions: any = Object.assign({ child: isChild }, options);
    const newURL: string = URI(window.location.href).query(newOptions).toString();

    window.history.replaceState({}, '', newURL);
  });
});
