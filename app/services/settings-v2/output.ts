import { Inject, mutation, StatefulService, InitAfter } from 'services/core';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'app-services';

interface IOutputServiceState {
  stream: obs.ISimpleStreaming | obs.IAdvancedStreaming;
  recording: obs.ISimpleRecording | obs.IAdvancedRecording;
  replay: obs.ISimpleReplayBuffer | obs.IAdvancedReplayBuffer;
  advancedMode: boolean;
}

type TOutputType = 'stream' | 'recording' | 'replay';

// Since the legacySettings api does not send deep objects we must set which properties are expected
const RECORDING_PROPERTIES = ['fileFormat', 'overwrite'];
const REPLAY_PROPERTIES = ['prefix', 'suffix'];

@InitAfter('VideoSettingsService')
export class OutputsService extends StatefulService<IOutputServiceState> {
  @Inject() settingsManagerService: SettingsManagerService;

  static initialState: IOutputServiceState = {
    stream: {} as obs.ISimpleStreaming | obs.IAdvancedStreaming,
    recording: {} as obs.ISimpleRecording | obs.IAdvancedRecording,
    replay: {} as obs.ISimpleReplayBuffer | obs.IAdvancedReplayBuffer,
    advancedMode: false,
  };

  outputs: Omit<IOutputServiceState, 'advancedMode'> = {
    stream: null,
    recording: null,
    replay: null,
  };
  activeOutputs: string[] = [];

  get streamSettings() {
    return this.state.advancedMode
      ? this.settingsManagerService.advancedStreamSettings
      : this.settingsManagerService.simpleStreamSettings;
  }

  get recordingSettings() {
    return this.state.advancedMode
      ? this.settingsManagerService.advancedRecordingSettings
      : this.settingsManagerService.simpleRecordingSettings;
  }

  get replaySettings() {
    return this.state.advancedMode
      ? this.settingsManagerService.advancedReplaySettings
      : this.settingsManagerService.simpleReplaySettings;
  }

  get hasActiveOutputs() {
    return this.activeOutputs.length > 0;
  }

  init() {
    this.SET_ADVANCED_MODE(this.settingsManagerService.simpleStreamSettings.useAdvanced);

    if (this.state.advancedMode) {
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

    RECORDING_PROPERTIES.forEach(
      (key: keyof obs.IAdvancedRecording | keyof obs.ISimpleRecording) => {
        this.setRecordingSetting(key, this.recordingSettings[key]);
      },
    );

    REPLAY_PROPERTIES.forEach(
      (key: keyof obs.IAdvancedReplayBuffer | keyof obs.ISimpleReplayBuffer) => {
        console.log(key, this.replaySettings[key]);
        this.setReplaySetting(key, this.replaySettings[key]);
      },
    );
  }

  createAdvancedOutputs() {
    const { stream, recording, replay } = this.outputs;
    if (stream) obs.SimpleStreamingFactory.destroy(stream as obs.ISimpleStreaming);
    if (recording) obs.SimpleRecordingFactory.destroy(recording as obs.ISimpleRecording);
    if (replay) obs.SimpleReplayBufferFactory.destroy(replay as obs.ISimpleReplayBuffer);

    this.outputs.stream = obs.AdvancedStreamingFactory.create();
    this.outputs.recording = obs.AdvancedRecordingFactory.create();
    this.outputs.replay = obs.AdvancedReplayBufferFactory.create();
    this.outputs.recording.streaming = this.outputs.stream;
    this.outputs.replay.streaming = this.outputs.stream;
  }

  createSimpleOutputs() {
    const { stream, recording, replay } = this.outputs;
    if (stream) obs.AdvancedStreamingFactory.destroy(stream as obs.IAdvancedStreaming);
    if (recording) obs.AdvancedRecordingFactory.destroy(recording as obs.IAdvancedRecording);
    if (replay) obs.AdvancedReplayBufferFactory.destroy(replay as obs.IAdvancedReplayBuffer);

    this.outputs.stream = obs.SimpleStreamingFactory.create();
    this.outputs.recording = obs.SimpleRecordingFactory.create();
    this.outputs.replay = obs.SimpleReplayBufferFactory.create();
  }

  setAdvanced(value: boolean) {
    if (this.state.advancedMode === value) return;

    value ? this.createAdvancedOutputs() : this.createSimpleOutputs();
    this.SET_ADVANCED_MODE(value);
  }

  setStreamSetting(key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming, value: unknown) {
    this.outputs.stream[key] = value;
    this.SET_SETTING('stream', key, value);
  }

  setRecordingSetting(
    key: keyof obs.IAdvancedRecording | keyof obs.ISimpleRecording,
    value: unknown,
  ) {
    this.outputs.recording[key] = value;
    this.SET_SETTING('recording', key, value);
  }

  setReplaySetting(
    key: keyof obs.IAdvancedReplayBuffer | keyof obs.ISimpleReplayBuffer,
    value: unknown,
  ) {
    this.outputs.replay[key] = value;
    this.SET_SETTING('replay', key, value);
  }

  startOutput(key: TOutputType) {
    this.outputs[key].start();
    this.activeOutputs.push(key);
  }

  endOutput(key: TOutputType) {
    this.outputs[key].stop();
    this.activeOutputs = this.activeOutputs.filter(output => output !== key);
  }

  @mutation()
  SET_SETTING(category: TOutputType, property: string, value: unknown) {
    this.state[category][property] = value;
  }

  @mutation()
  SET_ADVANCED_MODE(value: boolean) {
    this.state.advancedMode = value;
  }
}
