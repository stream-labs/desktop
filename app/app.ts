import { I18nService } from 'services/i18n';

// eslint-disable-next-line
window['eval'] = global.eval = () => {
  throw new Error('window.eval() is disabled for security');
};

import 'reflect-metadata';
import Vue from 'vue';

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
import moment from 'moment';
import { setupGlobalContextMenuForEditableElement } from 'util/menus/GlobalMenu';
import VModal from 'vue-js-modal';
import VeeValidate from 'vee-validate';
import ChildWindow from 'components/windows/ChildWindow.vue';
import OneOffWindow from 'components/windows/OneOffWindow.vue';
import electronLog from 'electron-log';

const { ipcRenderer, remote } = electron;

const nAirVersion = remote.process.env.NAIR_VERSION;
const isProduction = process.env.NODE_ENV === 'production';

type SentryParams = {
  organization: string;
  key: string;
  project: string;
};
const sentryOrg = 'o170115';

function getSentryDsn(p: SentryParams): string {
  return `https://${p.key}@${p.organization}.ingest.sentry.io/${p.project}`;
}

function getSentryCrashReportUrl(p: SentryParams): string {
  return `https://${p.organization}.ingest.sentry.io/api/${p.project}/minidump/?sentry_key=${p.key}`;
}

// This is the development DSN
let sentryParam: SentryParams = {
  organization: sentryOrg,
  project: '1262580',
  key: '1cb5cdf6a93c466dad570861b8c82b61',
};

if (isProduction) {
  // This is the production DSN
  sentryParam = Utils.isUnstable()
    ? { organization: sentryOrg, project: '1546758', key: '7451aaa71b7640a69ee1d31d6fd9ef78' }
    : { organization: sentryOrg, project: '1246812', key: '35a02d8ebec14fd3aadc9d95894fabcf' };

  electron.crashReporter.start({
    productName: 'n-air-app',
    companyName: 'n-air-app',
    submitURL: getSentryCrashReportUrl(sentryParam),
    extra: {
      version: nAirVersion,
      processType: 'renderer',
    },
  });
}

if ((isProduction || process.env.NAIR_REPORT_TO_SENTRY) && !electron.remote.process.env.NAIR_IPC) {
  Raven.config(getSentryDsn(sentryParam), {
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
    },
  })
    .addPlugin(RavenVue, Vue)
    .addPlugin(RavenConsole, console, { levels: ['error'] })
    .install();
}

require('./app.less');
require('./theme.less');

// Initiates tooltips and sets their parent wrapper
Vue.use(VTooltip);
VTooltip.options.defaultContainer = '#mainWrapper';
Vue.use(Toasted);
Vue.use(VeeValidate); // form validations
Vue.use(VModal);

// Disable chrome default drag/drop behavior
document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('dragenter', event => event.preventDefault());
document.addEventListener('drop', event => event.preventDefault());
document.addEventListener('auxclick', event => event.preventDefault());

document.addEventListener('DOMContentLoaded', () => {
  createStore().then(async store => {
    const windowsService: WindowsService = WindowsService.instance;

    if (Utils.isMainWindow()) {
      ipcRenderer.on('closeWindow', () => windowsService.closeMainWindow());
      AppService.instance.load();
    } else {
      if (Utils.isChildWindow()) {
        ipcRenderer.on('closeWindow', () => windowsService.closeChildWindow());
      }

      /* TODO
      if (usingSentry) {
        const userService = getResource<UserService>('UserService');

        const ctx = userService.getSentryContext();
        if (ctx) setSentryContext(ctx);
        userService.sentryContext.subscribe(setSentryContext);
      }
      */
    }

    // setup VueI18n plugin
    Vue.use(VueI18n);
    const i18nService: I18nService = I18nService.instance;
    await i18nService.load(); // load translations from a disk

    const i18n = new VueI18n({
      locale: i18nService.state.locale,
      fallbackLocale: i18nService.getFallbackLocale(),
      messages: i18nService.getLoadedDictionaries(),
      missing: ((locale: VueI18n.Locale, key: VueI18n.Path, vm: Vue, values: any[]): string => {
        if (values[0] && typeof values[0].fallback === 'string') {
          if (!isProduction) {
            // beware: enable following line only when investigating around i18n keys!
            // this adds huge amount of lines to console.

            // console.warn(`i18n missing key - ${key}: ${values[0].fallback}`);
            console.warn(`i18n missing key - ${key}: (フォールバックなし)`);
          }
          return values[0].fallback;
        }

        // 返すべきものがないときは何も返さずデフォルト動作に任せる
        // ref. https://github.com/kazupon/vue-i18n/blob/79e3bfe537d28b11a3119ff9ed0704e5dfa72cf3/src/index.js#L172-L188
      }) as any, // 型定義と実装が異なっているのでanyに飛ばす
      silentTranslationWarn: true,
    });

    I18nService.setVuei18nInstance(i18n);

    const momentLocale = i18nService.state.locale.split('-')[0];
    moment.locale(momentLocale);

    // create a root Vue component
    const windowId = Utils.getCurrentUrlParams().windowId;
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
      },
    });

    setupGlobalContextMenuForEditableElement();
  });
});

if (Utils.isDevMode()) {
  window.addEventListener('error', () => ipcRenderer.send('showErrorAlert'));
  window.addEventListener('keyup', ev => {
    if (ev.key === 'F12') electron.ipcRenderer.send('openDevTools');
  });
}

// ERRORS LOGGING

// catch and log unhandled errors/rejected promises:
electronLog.catchErrors({ onError: e => electronLog.log(`from ${Utils.getWindowId()}`, e) });

// override console.error
const consoleError = console.error;
console.error = function (...args: any[]) {
  // TODO: Suppress N-API error until we upgrade electron to v4.x
  if (/N\-API is an experimental feature/.test(args[0])) return;

  if (Utils.isDevMode()) ipcRenderer.send('showErrorAlert');
  writeErrorToLog(...args);
  consoleError.call(console, ...args);
};

/**
 * Try to serialize error arguments and stack and write them to the log file
 */
function writeErrorToLog(...errors: (Error | string)[]) {
  let message = '';

  // format error arguments depending on the type
  const formattedErrors = errors.map(error => {
    if (error instanceof Error) {
      message = error.stack;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      try {
        message = JSON.stringify(error);
      } catch (e) {
        message = 'UNSERIALIZABLE';
      }
    }
    return message;
  });

  // send error to the main process via IPC
  electronLog.error(`Error from ${Utils.getWindowId()} window:
    ${formattedErrors.join('\n')}
  `);
}
