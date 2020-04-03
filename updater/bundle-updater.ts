import fetch from 'node-fetch';
import * as electron from 'electron';

module.exports = async (basePath: string) => {
  const cdnBase = `https://slobs-cdn.streamlabs.com/${process.env.SLOBS_VERSION}/bundles/`;
  const localBase = `file://${basePath}/bundles/`;

  let useLocalBundles = false;

  if (process.argv.includes('--localBundles')) {
    useLocalBundles = true;
  }

  if (process.env.NODE_ENV !== 'production') {
    useLocalBundles = true;
  }

  // Check if bundle updates are available
  // TODO: In the future, support other bundles than just renderer.js
  // TODO: Cache the latest bundle name for offline use?
  let latestBundle: string;

  if (!useLocalBundles) {
    try {
      const response = await fetch(`${cdnBase}latest.json`);

      if (response.status / 100 >= 4) {
        console.log('Bundle update not available, using local bundles');
        useLocalBundles = true;
      } else {
        const parsed = await response.json();
        console.log('Latest bundle info:', parsed);

        latestBundle = parsed.renderer;
      }
    } catch (e) {
      console.log('Bundle prefetch error', e);
      useLocalBundles = true;
    }
  }

  electron.session.defaultSession?.webRequest.onBeforeRequest(
    { urls: ['https://slobs-cdn.streamlabs.com/bundles/*.js'] },
    (request, cb) => {
      if (useLocalBundles) {
        cb({ redirectURL: `${localBase}renderer.js` });
      } else {
        cb({ redirectURL: `${cdnBase}${latestBundle}` });
      }
    },
  );

  electron.session.defaultSession?.webRequest.onBeforeSendHeaders(
    { urls: [`${cdnBase}renderer.js`] },
    (details, cb) => {
      console.log('Before Send Headers');
      console.log(details);
      cb({});
    },
  );

  electron.session.defaultSession?.webRequest.onResponseStarted(
    { urls: [`${cdnBase}renderer.js`] },
    details => {
      console.log('Response Started');
      console.log(details);
    },
  );

  // The following handlers should rarely be used and are a failsafe.
  // If something goes wrong while fetching bundles even when the pre-fetch
  // succeeded, then we restart the app and force it to use local bundles.

  let appRelaunching = false;

  function revertToLocalBundles() {
    if (appRelaunching) return;
    appRelaunching = true;
    console.log('Reverting to local bundles and restarting app');
    electron.app.relaunch({ args: ['--localBundles'] });
    electron.app.quit();
  }

  electron.session.defaultSession?.webRequest.onHeadersReceived(
    { urls: [`${cdnBase}renderer.js`] },
    (info, cb) => {
      if (info.statusCode / 100 < 4) {
        cb({});
        return;
      }

      console.log(`Caught error fetching bundle with status ${info.statusCode}`);

      revertToLocalBundles();
    },
  );

  electron.session.defaultSession?.webRequest.onErrorOccurred(
    { urls: [`${cdnBase}renderer.js`] },
    info => {
      console.log('Caught error fetching bundle', info.error);

      revertToLocalBundles();
    },
  );
};
