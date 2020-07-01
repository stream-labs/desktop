import { StatefulService, mutation } from 'services/core';
import * as obs from '../../obs-api';
import fs from 'fs';
import util from 'util';
import electron from 'electron';
import path from 'path';
import { getChecksum } from 'util/requests';

const PLUGIN_PLIST_PATH =
  '/Library/CoreMediaIO/Plug-Ins/DAL/vcam-plugin.plugin/Contents/Info.plist';

const INTERNAL_PLIST_PATH =
  'node_modules/obs-studio-node/data/obs-plugins/slobs-virtual-cam/Info.plist';

export enum EVirtualWebcamPluginInstallStatus {
  Installed = 'installed',
  NotPresent = 'notPresent',
  Outdated = 'outdated',
}

interface IVirtualWebcamServiceState {
  running: boolean;
}

export class VirtualWebcamService extends StatefulService<IVirtualWebcamServiceState> {
  static initialState: IVirtualWebcamServiceState = { running: false };

  getInstallStatus(): Promise<EVirtualWebcamPluginInstallStatus> {
    return util
      .promisify(fs.exists)(PLUGIN_PLIST_PATH)
      .then(async exists => {
        if (exists) {
          try {
            const latest = await this.getCurrentChecksum();
            const installed = await getChecksum(PLUGIN_PLIST_PATH);

            if (latest === installed) {
              return EVirtualWebcamPluginInstallStatus.Installed;
            }

            return EVirtualWebcamPluginInstallStatus.Outdated;
          } catch (e) {
            console.error('Error comparing checksums on virtual webcam', e);
            // Assume outdated
            return EVirtualWebcamPluginInstallStatus.Outdated;
          }
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

  private getCurrentChecksum() {
    const internalPlistPath = path.join(electron.remote.app.getAppPath(), INTERNAL_PLIST_PATH);
    return getChecksum(internalPlistPath);
  }

  @mutation()
  private SET_RUNNING(running: boolean) {
    this.state.running = running;
  }
}
