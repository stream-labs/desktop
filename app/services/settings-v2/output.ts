import { Inject } from 'vue-property-decorator';
import { Service } from 'services/core/service';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'app-services';

export class OutputsService extends Service {
  @Inject() settingsManagerService: SettingsManagerService;

  outputs = {
    stream: null as obs.ISimpleStreaming | obs.IAdvancedStreaming,
    recording: null as obs.ISimpleRecording | obs.IAdvancedRecording,
    replay: null as obs.ISimpleReplayBuffer | obs.IAdvancedReplayBuffer,
  };
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
    let { stream, recording, replay } = this.outputs;
    if (stream) obs.SimpleStreamingFactory.destroy(stream as obs.ISimpleStreaming);
    if (recording) obs.SimpleRecordingFactory.destroy(recording as obs.ISimpleRecording);
    if (replay) obs.SimpleReplayBufferFactory.destroy(replay as obs.ISimpleReplayBuffer);

    stream = obs.AdvancedStreamingFactory.create();
    recording = obs.AdvancedRecordingFactory.create();
    replay = obs.AdvancedReplayBufferFactory.create();
  }

  createSimpleOutputs() {
    let { stream, recording, replay } = this.outputs;
    if (stream) obs.AdvancedStreamingFactory.destroy(stream as obs.IAdvancedStreaming);
    if (recording) obs.AdvancedRecordingFactory.destroy(recording as obs.IAdvancedRecording);
    if (replay) obs.AdvancedReplayBufferFactory.destroy(replay as obs.IAdvancedReplayBuffer);

    stream = obs.SimpleStreamingFactory.create();
    recording = obs.SimpleRecordingFactory.create();
    replay = obs.SimpleReplayBufferFactory.create();
  }

  setAdvanced(value: boolean) {
    if (this.advancedMode === value) return;

    value ? this.createAdvancedOutputs() : this.createSimpleOutputs();
    this.advancedMode = value;
  }

  setStreamSetting(key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming, value: unknown) {
    this.outputs.stream[key] = value;
  }

  setRecordingSetting(
    key: keyof obs.IAdvancedRecording | keyof obs.ISimpleRecording,
    value: unknown,
  ) {
    this.outputs.recording[key] = value;
  }

  setReplaySetting(
    key: keyof obs.IAdvancedReplayBuffer | keyof obs.ISimpleReplayBuffer,
    value: unknown,
  ) {
    this.outputs.replay[key] = value;
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
