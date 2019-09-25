"use strict";
exports.__esModule = true;
const obs = window['require']('obs-studio-node');

/* Use for...in operator to perfectly mirror the osn module */
for (let entry in obs) {
  const url = new URL(window.location.href);

  if (url.searchParams.get('windowId') === 'worker') {
    exports[entry] = obs[entry];
  } else {
    exports[entry] = new Proxy({}, {
      get(target, property) {
        throw new Error(`Attempted to access OBS property ${property} outside of the worker process. OBS can only be accessed from the worker process.`);
      }
    });
  }
}
