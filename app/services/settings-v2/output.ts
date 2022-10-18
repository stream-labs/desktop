import { Inject } from 'vue-property-decorator';
import { Service } from 'services/core/service';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'app-services';

export class OutputsService extends Service {
  @Inject() settingsManagerService: SettingsManagerService;

  stream: obs.ISimpleStreaming | obs.IAdvancedStreaming;
  recording: obs.ISimpleRecording | obs.IAdvancedRecording;
  replay: obs.ISimpleReplayBuffer | obs.IAdvancedReplayBuffer;
  activeOutputs: string[] = [];

  advancedMode: boolean;

  get streamSettings() {
    return this.advancedMode
      ? this.settingsManagerService.advancedStreamSettings
      : this.settingsManagerService.simpleStreamSettings;
  }

  get recordingSettings() {
    return this.advancedMode
      ? this.settingsManagerService.advancedRecordingSettings
      : this.settingsManagerService.simpleRecordingSettings;
  }

  get replaySettings() {
    return this.advancedMode
      ? this.settingsManagerService.advancedReplaySettings
      : this.settingsManagerService.simpleReplaySettings;
  }

  get hasActiveOutputs() {
    return this.activeOutputs.length > 0;
  }

  init() {
    super.init();

    this.advancedMode = this.settingsManagerService.simpleStreamSettings.useAdvanced;

    if (this.advancedMode) {
      this.createAdvancedOutputs();
    } else {
      this.createSimpleOutputs();
    }

    this.migrateSettings();
  }

  migrateSettings() {
    Object.keys(this.streamSettings).forEach(
      (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
        this.setStreamSetting(key, this.streamSettings[key]);
      },
    );

    Object.keys(this.recordingSettings).forEach(
      (key: keyof obs.IAdvancedRecording | keyof obs.ISimpleRecording) => {
        this.setRecordingSetting(key, this.recordingSettings[key]);
      },
    );

    Object.keys(this.replaySettings).forEach(
      (key: keyof obs.IAdvancedRecording | keyof obs.ISimpleRecording) => {
        this.setRecordingSetting(key, this.replaySettings[key]);
      },
    );
  }

  createAdvancedOutputs() {
    if (this.stream) obs.SimpleStreamingFactory.destroy(this.stream as obs.ISimpleStreaming);
    if (this.recording) obs.SimpleRecordingFactory.destroy(this.recording as obs.ISimpleRecording);
    if (this.replay) obs.SimpleReplayBufferFactory.destroy(this.replay as obs.ISimpleReplayBuffer);

    this.stream = obs.AdvancedStreamingFactory.create();
    this.recording = obs.AdvancedRecordingFactory.create();
    this.replay = obs.AdvancedReplayBufferFactory.create();
  }

  createSimpleOutputs() {
    if (this.stream) obs.AdvancedStreamingFactory.destroy(this.stream as obs.IAdvancedStreaming);
    if (this.recording) {
      obs.AdvancedRecordingFactory.destroy(this.recording as obs.IAdvancedRecording);
    }
    if (this.replay) {
      obs.AdvancedReplayBufferFactory.destroy(this.replay as obs.IAdvancedReplayBuffer);
    }

    this.stream = obs.SimpleStreamingFactory.create();
    this.recording = obs.SimpleRecordingFactory.create();
    this.replay = obs.SimpleReplayBufferFactory.create();
  }

  setAdvanced(value: boolean) {
    if (this.advancedMode === value) return;

    value ? this.createAdvancedOutputs() : this.createSimpleOutputs();
    this.advancedMode = value;
  }

  setStreamSetting(key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming, value: unknown) {
    this.stream[key] = value;
  }

  setRecordingSetting(
    key: keyof obs.IAdvancedRecording | keyof obs.ISimpleRecording,
    value: unknown,
  ) {
    this.recording[key] = value;
  }

  setReplaySetting(
    key: keyof obs.IAdvancedReplayBuffer | keyof obs.ISimpleReplayBuffer,
    value: unknown,
  ) {
    this.replay[key] = value;
  }

  startOutput(key: 'stream' | 'recording' | 'replay') {
    this[key].start();
    this.activeOutputs.push(key);
  }

  endOutput(key: 'stream' | 'recording' | 'replay') {
    this[key].stop();
    this.activeOutputs = this.activeOutputs.filter(output => output !== key);
  }
}
