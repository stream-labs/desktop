import { I18nService } from 'services/i18n';

window['eval'] = global.eval = () => {
  throw new Error('window.eval() is disabled for security');
};

import 'reflect-metadata';
import Vue from 'vue';
import URI from 'urijs';

import { createStore } from './store';
import { IWindowOptions, WindowsService } from './services/windows';
import { AppService } from './services/app';
import { ServicesManager } from './services-manager';
import Utils from './services/utils';
import electron from 'electron';
import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';
import RavenConsole from 'raven-js/plugins/console';
import VTooltip from 'v-tooltip';
import Toasted from 'vue-toasted';
import VueI18n from 'vue-i18n';
import VModal from 'vue-js-modal';
import VeeValidate from 'vee-validate';
import ChildWindow from 'components/windows/ChildWindow.vue';
import OneOffWindow from 'components/windows/OneOffWindow.vue';

const { ipcRenderer, remote } = electron;
const slobsVersion = remote.process.env.SLOBS_VERSION;
const isProduction = process.env.NODE_ENV === 'production';

window['obs'] = window['require']('obs-studio-node');

{ // Set up things for IPC
  // Connect to the IPC Server
  window['obs'].IPC.connect(process.env.SLOBS_IPC_PATH);
  document.addEventListener('close', (e) => {
    window['obs'].IPC.disconnect();
  });
}

// This is the development DSN
let sentryDsn = 'https://8f444a81edd446b69ce75421d5e91d4d@sentry.io/252950';

if (isProduction) {
  // This is the production DSN
  sentryDsn = 'https://6971fa187bb64f58ab29ac514aa0eb3d@sentry.io/251674';

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
}

if ((isProduction || process.env.SLOBS_REPORT_TO_SENTRY) && !electron.remote.process.env.SLOBS_IPC) {
  Raven.config(sentryDsn, {
    release: slobsVersion,
    dataCallback: data => {
      // Because our URLs are local files and not publicly
      // accessible URLs, we simply truncate and send only
      // the filename.  Unfortunately sentry's electron support
      // isn't that great, so we do this hack.
      // Some discussion here: https://github.com/getsentry/sentry/issues/2708
      const normalize = (filename: string) => {
        const splitArray = filename.split('/');
        return splitArray[splitArray.length - 1];
      };

      if (data.exception) {
        data.exception.values[0].stacktrace.frames.forEach((frame: any) => {
          frame.filename = normalize(frame.filename);
        });

        data.culprit = data.exception.values[0].stacktrace.frames[0].filename;
      }

      return data;
    }
  })
    .addPlugin(RavenVue, Vue)
    .addPlugin(RavenConsole, console, { levels: ['error'] })
    .install();
}

require('./app.less');

// Initiates tooltips and sets their parent wrapper
Vue.use(VTooltip);
VTooltip.options.defaultContainer = '#mainWrapper';
Vue.use(Toasted);
Vue.use(VeeValidate); // form validations
Vue.use(VModal);


// Disable chrome default drag/drop behavior
document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('drop', event => event.preventDefault());

document.addEventListener('DOMContentLoaded', () => {
  const storePromise = createStore();
  const servicesManager: ServicesManager = ServicesManager.instance;
  const windowsService: WindowsService = WindowsService.instance;
  const i18nService: I18nService = I18nService.instance;
  const windowId = Utils.getCurrentUrlParams().windowId;

  if (Utils.isMainWindow()) {
    ipcRenderer.on('closeWindow', () => windowsService.closeMainWindow());
    AppService.instance.load();
  } else {
    if (Utils.isChildWindow()) {
      ipcRenderer.on('closeWindow', () => windowsService.closeChildWindow());
    }
    servicesManager.listenMessages();
  }

  storePromise.then(async store => {

    Vue.use(VueI18n);

    await i18nService.load();

    const i18n = new VueI18n({
      locale: i18nService.state.locale,
      fallbackLocale: i18nService.getFallbackLocale(),
      messages: i18nService.getLoadedDictionaries(),
      silentTranslationWarn: true
    });

    I18nService.setVuei18nInstance(i18n);

    const vm = new Vue({
      el: '#app',
      i18n,
      store,
      render: h => {
        if (windowId === 'child') return h(ChildWindow);
        if (windowId === 'main') {
          const componentName = windowsService.state[windowId].componentName;
          return h(windowsService.components[componentName]);
        }
        return h(OneOffWindow);
      }
    });

  });
});
