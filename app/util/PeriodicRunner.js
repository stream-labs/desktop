// Class to manage "jobs" that run periodically.  These should only ever
// run in the main window, and should do something important that either
// updates the store, or changes/sets something in node-obs.  Eventually
// we may to split these up into their own classes, but there really
// shouldn't be too many of these, and store modules should do most of
/// the heavy lifting.

import { ConfigFileService } from '../services/config-file';
import store from '../store';
import { SourcesService } from '../services/sources.ts';


// DEPRECATION NOTICE:
// This class is now deprecated.  Instead, you should create
// a service that calls `setInterval` in its init() hook.

class PeriodicRunner {

  configFileService = ConfigFileService.instance;

  constructor() {
    this.jobs = [
      {
        method: this.runConfigSave,
        interval: 60 * 1000
      },
      {
        method: this.runSourceAttributesUpdate,
        interval: 1000
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
    this.configFileService.save();
  }

  runSourceAttributesUpdate() {
    SourcesService.instance.refreshSourceAttributes();
  }

};

export default PeriodicRunner;
