import { I18nService } from 'services/i18n';

window['eval'] = global.eval = () => {
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
import RavenConsole from 'raven-js/plugins/console';
import VTooltip from 'v-tooltip';
import VueI18n from 'vue-i18n';
import moment from 'moment';

const { ipcRenderer, remote } = electron;

const nAirVersion = remote.process.env.NAIR_VERSION;
const isProduction = process.env.NODE_ENV === 'production';

// This is the development DSN
let sentryDsn = 'https://1cb5cdf6a93c466dad570861b8c82b61@sentry.io/1262580';

if (isProduction) {
  // This is the production DSN
  sentryDsn = 'https://35a02d8ebec14fd3aadc9d95894fabcf@sentry.io/1246812';

  electron.crashReporter.start({
    productName: 'n-air-app',
    companyName: 'n-air-app',
    submitURL:
      'https://n-air-app.sp.backtrace.io:8443/post?' +
      'format=minidump&' +
      'token=66abc2eda8a8ead580b825dd034d9b4f9da4d54eeb312bf8ce713571e1b1d35f',
    extra: {
      version: nAirVersion,
      processType: 'renderer'
    }
  });
}

if ((isProduction || process.env.NAIR_REPORT_TO_SENTRY) && !electron.remote.process.env.NAIR_IPC) {
  Raven.config(sentryDsn, {
    release: nAirVersion,
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
          frame.filename = 'app:///' + normalize(frame.filename);
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

// Disable chrome default drag/drop behavior
document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('drop', event => event.preventDefault());

document.addEventListener('DOMContentLoaded', () => {
  const storePromise = createStore();
  const servicesManager: ServicesManager = ServicesManager.instance;
  const windowsService: WindowsService = WindowsService.instance;
  const i18nService: I18nService = I18nService.instance;
  const obsApiService = ObsApiService.instance;
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

  window['obs'] = obsApiService.nodeObs;

  storePromise.then(async store => {

    Vue.use(VueI18n);

    await i18nService.load();

    const i18n = new VueI18n({
      locale: i18nService.state.locale,
      fallbackLocale: i18nService.getFallbackLocale(),
      messages: i18nService.getLoadedDictionaries(),
      missing: ((locale: VueI18n.Locale, key: VueI18n.Path, vm: Vue, values: any[]): string  => {
        if (values[0] && typeof values[0].fallback === 'string') {
          if (!isProduction) {
            // beware: enable following line only when investigating around i18n keys!
            // this adds huge amount of lines to console.

            // console.warn(`i18n missing key - ${key}: ${values[0].fallback}`);
          }
          return values[0].fallback;
        }
        if (!isProduction) {
          console.warn(`i18n missing key - ${key}: (フォールバックなし)`);
        }

        // 返すべきものがないときは何も返さずデフォルト動作に任せる
        // ref. https://github.com/kazupon/vue-i18n/blob/79e3bfe537d28b11a3119ff9ed0704e5dfa72cf3/src/index.js#L172-L188
      }) as any, // 型定義と実装が異なっているのでanyに飛ばす
      silentTranslationWarn: true
    });

    I18nService.setVuei18nInstance(i18n);

    const momentLocale = i18nService.state.locale.split('-')[0];
    moment.locale(momentLocale);

    const vm = new Vue({
      el: '#app',
      i18n,
      store,
      render: h => {
        const componentName = windowsService.state[windowId].componentName;

        return h(windowsService.components[componentName]);
      }
    });

  });

  // Used for replacing the contents of this window with
  // a new top level component
  ipcRenderer.on(
    'window-setContents',
    (event: Electron.Event, options: IWindowOptions) => {
      windowsService.updateChildWindowOptions(options);

      // This is purely for developer convencience.  Changing the URL
      // to match the current contents, as well as pulling the options
      // from the URL, allows child windows to be refreshed without
      // losing their contents.
      const newOptions: any = Object.assign({ windowId: 'child' }, options);
      const newURL: string = URI(window.location.href)
        .query(newOptions)
        .toString();

      window.history.replaceState({}, '', newURL);
    }
  );
});
