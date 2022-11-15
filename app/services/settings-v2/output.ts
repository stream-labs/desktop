import { Inject, mutation, StatefulService, InitAfter } from 'services/core';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'app-services';
import { $t } from 'services/i18n';

interface IOutputServiceState {
  stream: obs.ISimpleStreaming | obs.IAdvancedStreaming;
  recording: obs.ISimpleRecording | obs.IAdvancedRecording;
  replay: obs.ISimpleReplayBuffer | obs.IAdvancedReplayBuffer;
}

type TOutputType = 'stream' | 'recording' | 'replay';

// Since the legacySettings api does not send deep objects we must set which properties are expected
const STREAM_PROPERTIES = ['delay', 'reconnect', 'network'];
const RECORDING_PROPERTIES = ['fileFormat', 'overwrite'];
const REPLAY_PROPERTIES = ['prefix', 'suffix'];

@InitAfter('VideoSettingsService')
export class OutputsService extends StatefulService<IOutputServiceState> {
  @Inject() settingsManagerService: SettingsManagerService;

  static initialState = {
    stream: {},
    recording: {},
    replay: {},
  };

  outputs: IOutputServiceState = {
    stream: null,
    recording: null,
    replay: null,
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

  get replaySettingsValues() {
    const replay = this.state.replay;
    return { prefix: replay.prefix, suffix: replay.suffix };
  }

  get recordingSettingsValues() {
    const recording = this.state.recording;
    return { fileFormat: recording.fileFormat, overwrite: recording.overwrite };
  }

  init() {
    this.advancedMode = this.settingsManagerService.simpleStreamSettings.useAdvanced;

    if (this.advancedMode) {
      this.createAdvancedOutputs();
    } else {
      this.createSimpleOutputs();
    }

    this.migrateSettings();
  }

  migrateSettings() {
    STREAM_PROPERTIES.forEach((key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
      this.setStreamSetting(key, this.streamSettings[key]);
    });

    RECORDING_PROPERTIES.forEach(
      (key: keyof obs.IAdvancedRecording | keyof obs.ISimpleRecording) => {
        this.setRecordingSetting(key, this.recordingSettings[key]);
      },
    );

    REPLAY_PROPERTIES.forEach(
      (key: keyof obs.IAdvancedReplayBuffer | keyof obs.ISimpleReplayBuffer) => {
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
    if (this.advancedMode === value) return;

    value ? this.createAdvancedOutputs() : this.createSimpleOutputs();
    this.advancedMode = value;
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
}
