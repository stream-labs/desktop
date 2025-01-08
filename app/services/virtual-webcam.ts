import { StatefulService, mutation } from 'services/core';
import * as obs from '../../obs-api';
import fs from 'fs';
import util from 'util';
import path from 'path';
import { getChecksum } from 'util/requests';
import { byOS, OS } from 'util/operating-systems';
import { Inject } from 'services/core/injector';
import { UsageStatisticsService, SourcesService } from 'app-services';
import * as remote from '@electron/remote';
import { Subject } from 'rxjs';
import { ESourceOutputFlags, VCamOutputType } from 'obs-studio-node';
import { RealmObject } from './realm';
import { ObjectSchema } from 'realm';

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

class VirtualCamServicePersistentState extends RealmObject {
  // Naming of these fields is taken from OBS for reference
  outputType: VCamOutputType;
  outputSelection: string;

  static schema: ObjectSchema = {
    name: 'VirtualCamServicePersistentState',
    properties: {
      outputType: { type: 'int', default: VCamOutputType.ProgramView },
      outputSelection: { type: 'string', default: '' },
    },
  };
}

VirtualCamServicePersistentState.register({ persist: true });

export class VirtualWebcamService extends StatefulService<IVirtualWebcamServiceState> {
  @Inject() usageStatisticsService: UsageStatisticsService;
  @Inject() sourcesService: SourcesService;
  virtualCamSettings = VirtualCamServicePersistentState.inject();

  static initialState: IVirtualWebcamServiceState = { running: false };

  runningChanged = new Subject<boolean>();

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
        const result = obs.NodeObs.OBS_service_isVirtualCamPluginInstalled();

        if (result === obs.EVcamInstalledStatus.Installed) {
          return EVirtualWebcamPluginInstallStatus.Installed;
        } else if (result === obs.EVcamInstalledStatus.LegacyInstalled) {
          return EVirtualWebcamPluginInstallStatus.Outdated;
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

    //obs.NodeObs.OBS_service_createVirtualWebcam('Streamlabs Desktop Virtual Webcam');
    obs.NodeObs.OBS_service_startVirtualCam();

    this.SET_RUNNING(true);
    this.runningChanged.next(true);

    this.usageStatisticsService.recordFeatureUsage('VirtualWebcam');
  }

  stop() {
    if (!this.state.running) return;

    obs.NodeObs.OBS_service_stopVirtualCam();
    //obs.NodeObs.OBS_service_removeVirtualWebcam();

    this.SET_RUNNING(false);
    this.runningChanged.next(false);
  }

  private getCurrentChecksum() {
    const internalPlistPath = path.join(remote.app.getAppPath(), INTERNAL_PLIST_PATH);
    return getChecksum(internalPlistPath);
  }

  update(type: VCamOutputType, name: string) {
    this.virtualCamSettings.db.write(() => {
      this.virtualCamSettings.deepPatch({
        outputType: type,
        outputSelection: name,
      });
    });
    obs.NodeObs.OBS_service_updateVirtualCam(type, name);
  }

  outputType(): VCamOutputType {
    return this.virtualCamSettings.outputType;
  }

  outputSelection(): string {
    return this.virtualCamSettings.outputSelection;
  }

  getVideoSources() {
    return this.sourcesService.views.sources.filter(
      source =>
        source.type !== 'scene' && source.getObsInput().outputFlags & ESourceOutputFlags.Video,
    );
  }

  @mutation()
  private SET_RUNNING(running: boolean) {
    this.state.running = running;
  }
}
