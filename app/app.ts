import { I18nService } from 'services/i18n';

window['eval'] = global.eval = () => {
  throw new Error('window.eval() is disabled for security');
};

import 'reflect-metadata';
import Vue from 'vue';

import { createStore } from './store';
import { WindowsService } from './services/windows';
import { AppService } from './services/app';
import { ServicesManager } from './services-manager';
import Utils from './services/utils';
import electron from 'electron';
import * as Sentry from '@sentry/browser';
import VTooltip from 'v-tooltip';
import Toasted from 'vue-toasted';
import VueI18n from 'vue-i18n';
import VModal from 'vue-js-modal';
import VeeValidate from 'vee-validate';
import ChildWindow from 'components/windows/ChildWindow.vue';
import OneOffWindow from 'components/windows/OneOffWindow.vue';
import electronLog from 'electron-log';

const { ipcRenderer, remote } = electron;
const slobsVersion = remote.process.env.SLOBS_VERSION;
const isProduction = process.env.NODE_ENV === 'production';
const isPreview = !!remote.process.env.SLOBS_PREVIEW;

window['obs'] = window['require']('obs-studio-node');

{
  // Set up things for IPC
  // Connect to the IPC Server
  window['obs'].IPC.connect(remote.process.env.SLOBS_IPC_PATH);
  document.addEventListener('close', e => {
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
    ignoreSystemCrashHandler: true,
    submitURL:
      'https://sentry.io/api/1283430/minidump/?sentry_key=01fc20f909124c8499b4972e9a5253f2',
    extra: {
      version: slobsVersion,
      processType: 'renderer',
    },
  });
}

if (
  (isProduction || process.env.SLOBS_REPORT_TO_SENTRY) &&
  !electron.remote.process.env.SLOBS_IPC
) {
  Sentry.init({
    dsn: sentryDsn,
    release: slobsVersion,
    sampleRate: isPreview ? 1.0 : 0.1,
    beforeSend: event => {
      // Because our URLs are local files and not publicly
      // accessible URLs, we simply truncate and send only
      // the filename.  Unfortunately sentry's electron support
      // isn't that great, so we do this hack.
      // Some discussion here: https://github.com/getsentry/sentry/issues/2708
      const normalize = (filename: string) => {
        const splitArray = filename.split('/');
        return splitArray[splitArray.length - 1];
      };

      if (event.exception) {
        event.exception.values[0].stacktrace.frames.forEach(frame => {
          frame.filename = normalize(frame.filename);
        });
      }

      return event;
    },
    integrations: [new Sentry.Integrations.Vue({ Vue })],
  });

  const oldConsoleError = console.error;

  console.error = (msg: string, ...params: any[]) => {
    oldConsoleError(msg, ...params);

    Sentry.withScope(scope => {
      if (params[0] instanceof Error) {
        scope.setExtra('exception', params[0].stack);
      }

      scope.setExtra('console-args', JSON.stringify(params, null, 2));
      Sentry.captureMessage(msg, Sentry.Severity.Error);
    });
  };
}

require('./app.g.less');

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
      silentTranslationWarn: true,
    });

    I18nService.setVuei18nInstance(i18n);

    const vm = new Vue({
      i18n,
      store,
      el: '#app',
      render: h => {
        if (windowId === 'child') return h(ChildWindow);
        if (windowId === 'main') {
          const componentName = windowsService.state[windowId].componentName;
          return h(windowsService.components[componentName]);
        }
        return h(OneOffWindow);
      },
    });
  });
});

// EVENT LOGGING

const consoleError = console.error;
console.error = function(...args: any[]) {
  logError(args[0]);
  consoleError.call(console, ...args);
};

function logError(error: Error | string) {
  let message = '';
  let stack = '';

  if (error instanceof Error) {
    message = error.message;
    stack = error.stack;
  } else if (typeof error === 'string') {
    message = error;
  }

  // send error to the main process via IPC
  electronLog.error(`Error from ${Utils.getWindowId()} window:
    ${message}
    ${stack}
  `);
}
