"use strict";
exports.__esModule = true;
// TODO: can we replace this with const?
var obs = window['require']('obs-studio-node');

/* Use for...in operator to perfectly mirror the osn module */
for (let entry in obs) {
  exports[entry] = obs[entry];
}
