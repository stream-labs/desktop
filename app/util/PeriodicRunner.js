// Class to manage "jobs" that run periodically.  These should only ever
// run in the main window, and should do something important that either
// updates the store, or changes/sets something in node-obs.  Eventually
// we may to split these up into their own classes, but there really
// shouldn't be too many of these, and store modules should do most of
/// the heavy lifting.

import configFileManager from './ConfigFileManager';
import store from '../store';
import SourcesService from '../services/sources';

class PeriodicRunner {

  constructor() {
    this.jobs = [
      {
        method: this.runConfigSave,
        interval: 60 * 1000
      },
      {
        method: this.runSourceAttributesUpdate,
        interval: 1000
      },
      {
        method: this.runPerformanceStatsUpdate,
        interval: 2 * 1000
      }
    ];
  }

  start() {
    if (!this.started) {
      this.jobs.forEach(job => {
        setInterval(() => {
          job.method();
        }, job.interval);
      });

      this.started = true;
    }
  }

  runConfigSave() {
    configFileManager.save();
  }

  runSourceAttributesUpdate() {
    SourcesService.instance.refreshSourceAttributes();
  }

  runPerformanceStatsUpdate() {
    store.dispatch('refreshPerformanceStats');
  }

};

export default PeriodicRunner;
