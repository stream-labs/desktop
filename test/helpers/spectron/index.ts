/// <reference path="../../../app/index.d.ts" />
import avaTest, { ExecutionContext, TestInterface } from 'ava';
import { Application } from 'spectron';
import { getClient } from '../api-client';
import { DismissablesService } from 'services/dismissables';
import { sleep } from '../sleep';

// save names of all running tests to use them in the retrying mechanism
const pendingTests: string[] = [];
export const test: TestInterface<ITestContext> = new Proxy(avaTest, {
  apply: (target, thisArg, args) => {
    const testName = args[0];
    pendingTests.push(testName);
    return target.apply(thisArg, args);
  },
});

const path = require('path');
const fs = require('fs');
const os = require('os');
const rimraf = require('rimraf');

const afterStartCallbacks: ((t: TExecutionContext) => any)[] = [];
export function afterAppStart(cb: (t: TExecutionContext) => any) {
  afterStartCallbacks.push(cb);
}

async function focusWindow(t: any, regex: RegExp) {
  const handles = await t.context.app.client.windowHandles();

  for (const handle of handles.value) {
    await t.context.app.client.window(handle);
    const url = await t.context.app.client.getUrl();
    if (url.match(regex)) return;
  }
}


// Focuses the main window
export async function focusMain(t: any) {
  await focusWindow(t, /windowId=main$/);
}


// Focuses the child window
export async function focusChild(t: any) {
  await focusWindow(t, /windowId=child/);
}

export async function waitForLoader(t: any) {
  await t.context.app.client.waitForExist('.main-loading', 10000, true);
}

interface ITestRunnerOptions {
  skipOnboarding?: boolean;
  restartAppAfterEachTest?: boolean;

  /**
   * Called after cache directory is created but before
   * the app is started.  This is useful for setting up
   * some known state in the cache directory before the
   * app starts up and loads it.
   */
  beforeAppStartCb?(t: any): Promise<any>;
}

const DEFAULT_OPTIONS: ITestRunnerOptions = {
  skipOnboarding: true,
  restartAppAfterEachTest: true,
};

export interface ITestContext {
  cacheDir: string;
  app: Application;
}

export type TExecutionContext = ExecutionContext<ITestContext>;

export function useSpectron(options: ITestRunnerOptions = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  let appIsRunning = false;
  let context: any = null;
  let app: Application;
  let testPassed = false;
  let failMsg = '';
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'n-air-test'));

  async function startApp(t: TExecutionContext): Promise<Application> {
    t.context.cacheDir = cacheDir;
    app = t.context.app = new Application({
      path: path.join(__dirname, '..', '..', '..', '..', 'node_modules', '.bin', 'electron.cmd'),
      args: [
        '--require',
        path.join(__dirname, 'context-menu-injected.js'),
        '--require',
        path.join(__dirname, 'dialog-injected.js'),
        '.',
      ],
      env: {
        NODE_ENV: 'test',
        NAIR_CACHE_DIR: t.context.cacheDir,
      },
      webdriverOptions: {
        // most of deprecation warning encourage us to use WebdriverIO actions API
        // however the documentation for this API looks very poor, it provides only one example:
        // http://webdriver.io/api/protocol/actions.html
        // disable deprecation warning and waiting for better docs now
        deprecationWarnings: false,
      },
      chromeDriverArgs: ['--remote-debugging-port=12209'],
    });

    if (options.beforeAppStartCb) await options.beforeAppStartCb(t);

    await t.context.app.start();

    // Disable CSS transitions while running tests to allow for eager test clicks
    const disableTransitionsCode = `
      const disableAnimationsEl = document.createElement('style');
      disableAnimationsEl.textContent =
        '*{ transition: none !important; transition-property: none !important; animation: none !important }';
      document.head.appendChild(disableAnimationsEl);
    `;
    await focusMain(t);
    await t.context.app.webContents.executeJavaScript(disableTransitionsCode);

    // Wait up to 2 seconds before giving up looking for an element.
    // This will slightly slow down negative assertions, but makes
    // the tests much more stable, especially on slow systems.
    t.context.app.client.timeouts('implicit', 2000);

    // await sleep(100000);

    // Pretty much all tests except for onboarding-specific
    // tests will want to skip this flow, so we do it automatically.
    await waitForLoader(t);
    if (options.skipOnboarding) {
      await t.context.app.client.waitForExist('.onboarding-step', 10000);
      await t.context.app.client.click('[data-test="Skip"]');

      // This will only show up if OBS is installed
      if (await t.context.app.client.isExisting('[data-test="Skip"]')) {
        await t.context.app.client.click('[data-test="Skip"]');
      }
    } else {
      // Wait for the connect screen before moving on
      await t.context.app.client.isExisting('[data-test="NiconicoSignup"]');
    }

    // disable the popups that prevents context menu to be shown
    const client = await getClient();
    const dismissablesService = client.getResource<DismissablesService>('DismissablesService');
    dismissablesService.dismissAll();

    // disable animations in the child window
    await focusChild(t);
    await t.context.app.webContents.executeJavaScript(disableTransitionsCode);
    await focusMain(t);

    context = t.context;
    appIsRunning = true;

    for (const callback of afterStartCallbacks) {
      await callback(t);
    }

    return app;
  }

  async function stopApp(clearCache = true) {
    try {
      await app.stop();
    } catch (e) {
      fail('Crash on shutdown');
      console.error(e);
    }
    appIsRunning = false;

    if (!clearCache) return;
    await new Promise(resolve => {
      rimraf(context.cacheDir, resolve);
    });
  }

  test.beforeEach(async t => {
    testPassed = false;

    t.context.app = app;
    if (options.restartAppAfterEachTest || !appIsRunning) await startApp(t);
  });

  test.afterEach(async t => {
    testPassed = true;
  });

  test.afterEach.always(async t => {
    // wrap in try/catch for the situation when we have a crash
    // so we still can read the logs after the crash
    try {
      const client = await getClient();
      await client.unsubscribeAll();
      if (options.restartAppAfterEachTest) {
        client.disconnect();
        await stopApp();
      }
    } catch (e) {
      fail('Test finalization failed');
      console.error(e);
    }

    if (!testPassed) {
      fail();
      t.fail(failMsg);
    }
  });

  test.after.always(async t => {
    if (!appIsRunning) return;
    await stopApp();
  });

  /**
   * mark tests as failed
   */
  function fail(msg?: string) {
    testPassed = false;
    if (msg) failMsg = msg;
  }
}
