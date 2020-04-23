import { StatefulService, mutation } from 'services/core';
import * as obs from '../../obs-api';
import fs from 'fs';
import util from 'util';

const PLUGIN_PLIST_PATH =
  '/Library/CoreMediaIO/Plug-Ins/DAL/vcam-plugin.plugin/Contents/Info.plist';

export enum EVirtualWebcamPluginInstallStatus {
  Installed = 'installed',
  NotPresent = 'notPresent',
  Outdated = 'outdated', // TODO
}

interface IVirtualWebcamServiceState {
  running: boolean;
}

export class VirtualWebcamService extends StatefulService<IVirtualWebcamServiceState> {
  static initialState: IVirtualWebcamServiceState = { running: false };

  getInstallStatus(): Promise<EVirtualWebcamPluginInstallStatus> {
    return util
      .promisify(fs.exists)(PLUGIN_PLIST_PATH)
      .then(exists => {
        if (exists) {
          // TODO: Check if update is required
          return EVirtualWebcamPluginInstallStatus.Installed;
        }

        return EVirtualWebcamPluginInstallStatus.NotPresent;
      })
      .catch(e => {
        console.error('Error checking for presence of virtual webcam', e);
        return EVirtualWebcamPluginInstallStatus.NotPresent;
      });
  }

  install() {
    obs.NodeObs.OBS_service_installVirtualCamPlugin();
  }

  start() {
    if (this.state.running) return;

    obs.NodeObs.OBS_service_createVirtualWebcam('Streamlabs OBS Virtual Webcam');
    obs.NodeObs.OBS_service_startVirtualWebcam();

    this.SET_RUNNING(true);
  }

  stop() {
    if (!this.state.running) return;

    obs.NodeObs.OBS_service_stopVirtualWebcam();
    obs.NodeObs.OBS_service_removeVirtualWebcam();

    this.SET_RUNNING(false);
  }

  @mutation()
  SET_RUNNING(running: boolean) {
    this.state.running = running;
  }
}
