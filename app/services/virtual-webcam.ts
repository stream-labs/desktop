import { StatefulService, mutation } from 'services/core';
import * as obs from '../../obs-api';
import fs from 'fs';
import util from 'util';
import path from 'path';
import { getChecksum } from 'util/requests';
import { byOS, OS } from 'util/operating-systems';
import { Inject } from 'services/core/injector';
import { UsageStatisticsService } from 'services/usage-statistics';
import * as remote from '@electron/remote';

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
  @Inject() usageStatisticsService: UsageStatisticsService;

  static initialState: IVirtualWebcamServiceState = { running: false };

  getInstallStatus(): Promise<EVirtualWebcamPluginInstallStatus> {
    return byOS({
      [OS.Mac]: async () => {
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
              } catch (e: unknown) {
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
      },
      [OS.Windows]: async () => {
        if (obs.NodeObs.OBS_service_isVirtualCamPluginInstalled()) {
          return EVirtualWebcamPluginInstallStatus.Installed;
        } else {
          return EVirtualWebcamPluginInstallStatus.NotPresent;
        }
      },
    });
  }

  install() {
    obs.NodeObs.OBS_service_installVirtualCamPlugin();
  }

  uninstall() {
    obs.NodeObs.OBS_service_uninstallVirtualCamPlugin();
  }

  start() {
    if (this.state.running) return;

    obs.NodeObs.OBS_service_createVirtualWebcam('Streamlabs OBS Virtual Webcam');
    obs.NodeObs.OBS_service_startVirtualWebcam();

    this.SET_RUNNING(true);

    this.usageStatisticsService.recordFeatureUsage('VirtualWebcam');
  }

  stop() {
    if (!this.state.running) return;

    obs.NodeObs.OBS_service_stopVirtualWebcam();
    obs.NodeObs.OBS_service_removeVirtualWebcam();

    this.SET_RUNNING(false);
  }

  private getCurrentChecksum() {
    const internalPlistPath = path.join(remote.app.getAppPath(), INTERNAL_PLIST_PATH);
    return getChecksum(internalPlistPath);
  }

  @mutation()
  private SET_RUNNING(running: boolean) {
    this.state.running = running;
  }
}
