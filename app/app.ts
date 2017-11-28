window['eval'] = global.eval = function () {
  throw new Error('window.eval() is disabled for security');
};

import 'reflect-metadata';
import Vue from 'vue';
import URI from 'urijs';

import { createStore } from './store';
import { ObsApiService } from './services/obs-api';
import { IWindowOptions, WindowsService } from './services/windows';
import { AppService } from './services/app';
import { ServicesManager } from './services-manager';
import Utils from './services/utils';
import electron from 'electron';
import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';

const { ipcRenderer, remote } = electron;

const slobsVersion = remote.process.env.SLOBS_VERSION;

if (remote.process.env.NODE_ENV === 'production') {
  Raven
    .config('https://6971fa187bb64f58ab29ac514aa0eb3d@sentry.io/251674', {
      release: slobsVersion
    })
    .addPlugin(RavenVue, Vue)
    .install();
}

electron.crashReporter.start({
  productName: 'streamlabs-obs',
  companyName: 'streamlabs',
  submitURL: 
    'https://streamlabs.sp.backtrace.io:6098/post?' +
    'format=minidump&' +
    'token=e3f92ff3be69381afe2718f94c56da4644567935cc52dec601cf82b3f52a06ce',
  extra: {
    version: slobsVersion,
    processType: 'renderer'
  }
});

require('./app.less');

document.addEventListener('DOMContentLoaded', () => {
  const store = createStore();
  const servicesManager: ServicesManager = ServicesManager.instance;
  const windowsService: WindowsService = WindowsService.instance;
  const obsApiService = ObsApiService.instance;
  const isChild = Utils.isChildWindow();

  if (isChild) {
    ipcRenderer.on('closeWindow', () => windowsService.closeChildWindow());
    servicesManager.listenMessages();
  } else {
    ipcRenderer.on('closeWindow', () => windowsService.closeMainWindow());
    AppService.instance.load();
  }

  window['obs'] = obsApiService.nodeObs;

  const vm = new Vue({
    el: '#app',
    store,
    render: h => {
      const componentName = isChild ?
          windowsService.state.child.componentName :
          windowsService.state.main.componentName;

      return h(windowsService.components[componentName]);
    }
  });

  // Used for replacing the contents of this window with
  // a new top level component
  ipcRenderer.on('window-setContents', (event: Electron.Event, options: IWindowOptions) => {
    windowsService.updateChildWindowOptions(options);

    // This is purely for developer convencience.  Changing the URL
    // to match the current contents, as well as pulling the options
    // from the URL, allows child windows to be refreshed without
    // losing their contents.
    const newOptions: any = Object.assign({ child: isChild }, options);
    const newURL: string = URI(window.location.href).query(newOptions).toString();

    window.history.replaceState({}, '', newURL);
  });
});
