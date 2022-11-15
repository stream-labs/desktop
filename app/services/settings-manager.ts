import { Service, ViewHandler } from 'services/core';
import * as obs from '../../obs-api';

/*
Eventually this service will be in charge of storing and managing settings profiles
once the new persistant storage system is finalized. For now it just retrieves settings
from the backend.
*/

class SettingsManagerViews extends ViewHandler<{}> {}

export class SettingsManagerService extends Service {
  get simpleStreamSettings() {
    return obs.SimpleStreamingFactory.legacySettings;
  }

  get advancedStreamSettings() {
    return obs.AdvancedStreamingFactory.legacySettings;
  }

  get simpleRecordingSettings() {
    return obs.SimpleRecordingFactory.legacySettings;
  }

  get advancedRecordingSettings() {
    return obs.AdvancedRecordingFactory.legacySettings;
  }

  get simpleReplaySettings() {
    return obs.SimpleReplayBufferFactory.legacySettings;
  }

  get advancedReplaySettings() {
    return obs.AdvancedReplayBufferFactory.legacySettings;
  }

  get videoSettings() {
    return obs.VideoFactory.legacySettings;
  }

  get advancedAudioSettings() {
    return {
      monitoringDevice: obs.AudioFactory.monitoringDeviceLegacy,
      disableAudioDucking: obs.AudioFactory.disableAudioDuckingLegacy,
    };
  }

  get miscSettings() {
    return {
      browserAccel: obs.NodeObs.GetBrowserAccelerationLegacy(),
      caching: obs.NodeObs.GetMediaFileCachingLegacy(),
      processPriority: obs.NodeObs.GetProcessPriorityLegacy(),
    };
  }

  get forceGPURRendering() {
    return obs.NodeObs.GetForceGPURenderingLegacy();
  }
}
