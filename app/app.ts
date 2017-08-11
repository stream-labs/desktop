window['eval'] = global.eval = function () {
  throw new Error('window.eval() is disabled for security');
};

import 'reflect-metadata';
import Vue from 'vue';
import _ from 'lodash';
import URI from 'urijs';

import { createStore } from './store';
import { ServicesManager } from './services-manager';
import { ObsApiService } from './services/obs-api';
import { WindowService } from './services/window';
import { HotkeysService } from './services/hotkeys';
import { OnboardingService } from './services/onboarding';
import { UserService } from './services/user';
import Utils from './services/utils.ts';
import { ConfigPersistenceService } from './services/config-persistence';
import electron from './vendor/electron';

const { ipcRenderer, remote } = electron;

require('./app.less');

document.addEventListener('DOMContentLoaded', () => {
  const store = createStore();
  const servicesManager = ServicesManager.instance;
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
  } else {
    ConfigPersistenceService.instance.load();

    // Uncomment to start up from an overlay file
    // OverlaysPersistenceService.instance.loadOverlay('C:\\Users\\acree\\Downloads\\testing.overlay');

    // Set up auto save
    const autoSave = setInterval(() => {
      ConfigPersistenceService.instance.save();
    }, 60 * 1000);


    ipcRenderer.on('shutdown', () => {
      clearInterval(autoSave);
      ConfigPersistenceService.instance.rawSave();
      remote.getCurrentWindow().close();
    });

    windowService.setWindowOptions({ component: 'Main' });

    HotkeysService.instance.bindAllHotkeys();
    OnboardingService.instance;
    UserService.instance;
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

  if (!Utils.isChildWindow()) servicesManager.listenApiCalls();

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
