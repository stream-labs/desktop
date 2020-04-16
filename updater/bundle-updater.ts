import fetch from 'node-fetch';
import * as electron from 'electron';
import * as path from 'path';

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

  const localManifest = require(path.join(`${basePath}/bundles/manifest.json`));

  console.log('Local bundle info:', localManifest);

  // Check if bundle updates are available
  // TODO: Cache the latest bundle name for offline use?
  let serverManifest: { [bundle: string]: string } | undefined;

  if (!useLocalBundles) {
    try {
      const response = await fetch(`${cdnBase}manifest.json`);

      if (response.status / 100 >= 4) {
        console.log('Bundle manifest not available, using local bundles');
        useLocalBundles = true;
      } else {
        const parsed = await response.json();
        console.log('Latest bundle info:', parsed);

        serverManifest = parsed;
      }
    } catch (e) {
      console.log('Bundle manifest fetch error', e);
      useLocalBundles = true;
    }
  }

  electron.session.defaultSession?.webRequest.onBeforeRequest(
    { urls: ['https://slobs-cdn.streamlabs.com/bundles/*.js'] },
    (request, cb) => {
      const bundleName = request.url.split('/')[4];

      if (!useLocalBundles && serverManifest && serverManifest[bundleName]) {
        if (serverManifest[bundleName] !== localManifest[bundleName]) {
          console.log(`Newer version of ${bundleName} is available`);
          cb({ redirectURL: `${cdnBase}${serverManifest[bundleName]}` });
          return;
        }
      }

      console.log(`Using local bundle for ${bundleName}`);
      cb({ redirectURL: `${localBase}${localManifest[bundleName]}` });
    },
  );

  // The following handlers should rarely be used and are a failsafe.
  // If something goes wrong while fetching bundles even when the pre-fetch
  // succeeded, then we restart the app and force it to use local bundles.

  // TODO
  // let appRelaunching = false;

  // function revertToLocalBundles() {
  //   if (appRelaunching) return;
  //   appRelaunching = true;
  //   console.log('Reverting to local bundles and restarting app');
  //   electron.app.relaunch({ args: ['--localBundles'] });
  //   electron.app.quit();
  // }

  // if (!useLocalBundles && latestBundle) {
  //   electron.session.defaultSession?.webRequest.onHeadersReceived(
  //     { urls: [`${cdnBase}${latestBundle}`] },
  //     (info, cb) => {
  //       if (info.statusCode / 100 < 4) {
  //         cb({});
  //         return;
  //       }

  //       console.log(`Caught error fetching bundle with status ${info.statusCode}`);

  //       revertToLocalBundles();
  //     },
  //   );

  //   electron.session.defaultSession?.webRequest.onErrorOccurred(
  //     { urls: [`${cdnBase}${latestBundle}`] },
  //     info => {
  //       console.log('Caught error fetching bundle', info.error);

  //       revertToLocalBundles();
  //     },
  //   );
  // }
};
