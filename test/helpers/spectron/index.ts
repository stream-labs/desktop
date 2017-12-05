/// <reference path="../../../app/index.d.ts" />
import test from 'ava';
import { Application } from 'spectron';
import { getClient } from '../api-client';

const path = require('path');
const fs = require('fs');
const os = require('os');
const rimraf = require('rimraf');

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
  await focusWindow(t, /index\.html$/);
}


// Focuses the child window
export async function focusChild(t: any) {
  await focusWindow(t, /child=true/);
}

interface ITestRunnerOptions {
  skipOnboarding?: boolean;
  restartAppAfterEachTest?: boolean;
  initApiClient?: boolean;
}

const DEFAULT_OPTIONS: ITestRunnerOptions = {
  skipOnboarding: true,
  restartAppAfterEachTest: true,
  initApiClient: false
};

export function useSpectron(options: ITestRunnerOptions) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  let appIsRunning = false;
  let context: any = null;
  let app: any;

  async function startApp(t: any) {
    t.context.cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slobs-test'));
    app = t.context.app = new Application({
      path: path.join(__dirname, '..', '..', '..', '..', 'node_modules', '.bin', 'electron.cmd'),
      args: ['--require', path.join(__dirname, 'context-menu-injected.js'), '.'],
      env: {
        NODE_ENV: 'test',
        SLOBS_CACHE_DIR: t.context.cacheDir
      }
    });

    await t.context.app.start();

    // Wait up to 2 seconds before giving up looking for an element.
    // This will slightly slow down negative assertions, but makes
    // the tests much more stable, especially on slow systems.
    t.context.app.client.timeouts('implicit', 2000);

    // Pretty much all tests except for onboarding-specific
    // tests will want to skip this flow, so we do it automatically.
    if (options.skipOnboarding) {
      await focusMain(t);
      await t.context.app.client.click('a=Setup later');

      // This will only show up if OBS is installed
      if (await t.context.app.client.isExisting('button=Start Fresh')) {
        await t.context.app.client.click('button=Start Fresh');
      }
    }

    context = t.context;
    appIsRunning = true;
  }

  async function stopApp() {
    await context.app.stop();
    await new Promise((resolve) => {
      rimraf(context.cacheDir, resolve);
    });
    appIsRunning = false;
  }

  test.beforeEach(async t => {
    t.context.app = app;
    if (options.restartAppAfterEachTest || !appIsRunning) await startApp(t);
  });

  test.afterEach.always(async t => {
    if (options.initApiClient) {
      const client = await getClient();
      await client.unsubscribeAll();
    }
    if (options.restartAppAfterEachTest) await stopApp();
  });

  test.after.always(async t => {
    if (appIsRunning) await stopApp();
  });
}
