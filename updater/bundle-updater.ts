import * as request from 'request';
import * as electron from 'electron';

/**
 * Use our own promisify for request, has better typings
 */
const prequest = (info: request.UriOptions & request.CoreOptions) => {
  return new Promise<request.Response>((resolve, reject) => {
    request(info, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
};

module.exports = async (basePath: string) => {
  const cdnBase = `https://streamlabs-obs-dev.s3-us-west-2.amazonaws.com/${process.env.SLOBS_VERSION}/bundles/`;
  const localBase = `file://${basePath}/bundles/`;

  let useLocalBundles = false;

  if (process.argv.includes('--localBundles')) {
    useLocalBundles = true;
  }

  // Check if bundle updates are available
  // TODO: In the future, support other bundles than just renderer.js
  try {
    const response = await prequest({ uri: `${cdnBase}renderer.js`, method: 'HEAD' });
    if (response.statusCode / 100 >= 4) {
      console.log('Bundle update not available, using local bundles');
      useLocalBundles = true;
    }
  } catch (e) {
    console.log('Bundle prefetch error', e);
    useLocalBundles = true;
  }

  electron.session.defaultSession?.webRequest.onBeforeRequest(
    { urls: ['https://slobs-cdn.streamlabs.com/bundles/*.js'] },
    (request, cb) => {
      if (useLocalBundles) {
        cb({ redirectURL: `${localBase}renderer.js` });
      } else {
        cb({ redirectURL: `${cdnBase}renderer.js` });
      }
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
