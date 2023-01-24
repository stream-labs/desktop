import { Subject } from 'rxjs';
import { Inject, mutation, StatefulService, InitAfter } from 'services/core';
import * as obs from '../../../obs-api';
import { SettingsManagerService, StreamingService } from 'app-services';
import { $t } from 'services/i18n';

interface IOutputServiceState {
  stream: obs.ISimpleStreaming | obs.IAdvancedStreaming;
  recording: obs.ISimpleRecording | obs.IAdvancedRecording;
  replay: obs.ISimpleReplayBuffer | obs.IAdvancedReplayBuffer;
  videoEncoder: obs.IVideoEncoder;
  advancedMode: boolean;
}

type TOutputType = 'stream' | 'recording' | 'replay';
type TStreamProperty = keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming;
type TRecordingProperty = keyof obs.IAdvancedRecording | keyof obs.ISimpleRecording;
type TReplayProperty = keyof obs.IAdvancedReplayBuffer | keyof obs.ISimpleReplayBuffer;

// Since the legacySettings api does not send deep objects we must set which properties are expected
const STREAM_PROPERTIES: TStreamProperty[] = [
  'delay',
  'reconnect',
  'network',
  'videoEncoder',
  'service',
  'enforceServiceBitrate',
  'enableTwitchVOD',
];
const SIMPLE_STREAM_PROPERTIES: TStreamProperty[] = ['audioEncoder', 'customEncSettings'];
const ADV_STREAM_PROPERTIES: TStreamProperty[] = [
  'audioTrack',
  'twitchTrack',
  'rescaling',
  'outputWidth',
  'outputHeight',
];
const RECORDING_PROPERTIES: TRecordingProperty[] = [
  'fileFormat',
  'overwrite',
  'videoEncoder',
  'format',
  'path',
  'noSpace',
  'muxerSettings',
];
const SIMPLE_RECORDING_PROPERTIES: TRecordingProperty[] = ['quality', 'audioEncoder', 'lowCPU'];
const ADV_RECORDING_PROPERTIES: TRecordingProperty[] = [
  'mixer',
  'rescaling',
  'outputWidth',
  'outputHeight',
  'useStreamEncoders',
];
const REPLAY_PROPERTIES: TReplayProperty[] = ['prefix', 'suffix', 'duration', 'usesStream'];
const ADV_REPLAY_PROPERTIES: TReplayProperty[] = ['mixer'];

@InitAfter('VideoSettingsService')
export class OutputsService extends StatefulService<IOutputServiceState> {
  @Inject() settingsManagerService: SettingsManagerService;
  @Inject() streamingService: StreamingService;

  static initialState: IOutputServiceState = {
    stream: {} as obs.ISimpleStreaming | obs.IAdvancedStreaming,
    recording: {} as obs.ISimpleRecording | obs.IAdvancedRecording,
    replay: {} as obs.ISimpleReplayBuffer | obs.IAdvancedReplayBuffer,
    videoEncoder: {} as obs.IVideoEncoder,
    advancedMode: false,
  };

  outputs: Omit<IOutputServiceState, 'advancedMode' | 'videoEncoder'> = {
    stream: null,
    recording: null,
    replay: null,
  };

  activeOutputs: string[] = [];

  advancedModeChanged = new Subject<boolean>();

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

  get replaySettingsValues() {
    const replay = this.state.replay;
    return { prefix: replay.prefix, suffix: replay.suffix };
  }

  get recordingSettingsValues() {
    const recording = this.state.recording;
    return { fileFormat: recording.fileFormat, overwrite: recording.overwrite };
  }

  init() {
    this.SET_ADVANCED_MODE(this.settingsManagerService.simpleStreamSettings.useAdvanced);
    this.prepOutputs(this.state.advancedMode);
  }

  migrateSettings() {
    this.migrateStreamProperties(STREAM_PROPERTIES);
    this.migrateRecordingProperties(RECORDING_PROPERTIES);
    this.migrateReplayProperties(REPLAY_PROPERTIES);

    if (this.state.advancedMode) {
      this.migrateStreamProperties(ADV_STREAM_PROPERTIES);
      this.migrateRecordingProperties(ADV_RECORDING_PROPERTIES);
      this.migrateReplayProperties(ADV_REPLAY_PROPERTIES);
    } else {
      this.migrateStreamProperties(SIMPLE_STREAM_PROPERTIES);
      this.migrateRecordingProperties(SIMPLE_RECORDING_PROPERTIES);
    }
  }

  migrateStreamProperties(keys: TStreamProperty[]) {
    keys.forEach(key => this.setStreamSetting(key, this.streamSettings[key]));
  }

  migrateRecordingProperties(keys: TRecordingProperty[]) {
    keys.forEach(key => this.setRecordingSetting(key, this.recordingSettings[key]));
  }

  migrateReplayProperties(keys: TReplayProperty[]) {
    keys.forEach(key => this.setReplaySetting(key, this.replaySettings[key]));
  }

  prepOutputs(advancedMode: boolean) {
    advancedMode ? this.createAdvancedOutputs() : this.createSimpleOutputs();
    this.migrateSettings();
    this.connectSignals();
    this.connectReferences();
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

  connectSignals() {
    Object.values(this.outputs).forEach(output => {
      output.signalHandler = (signal: obs.EOutputSignal) =>
        this.streamingService.actions.handleOBSOutputSignal(signal);
    });
  }

  connectReferences() {
    this.outputs.recording.streaming = this.outputs.stream;
    this.outputs.replay.streaming = this.outputs.stream;
    this.outputs.replay.recording = this.outputs.recording;
  }

  setAdvanced(value: boolean) {
    if (this.state.advancedMode === value) return;

    this.prepOutputs(value);
    this.SET_ADVANCED_MODE(value);
    this.advancedModeChanged.next(value);
  }

  setStreamSetting(key: TStreamProperty, value: unknown) {
    this.outputs.stream[key] = value;
    this.SET_SETTING('stream', key, value);
  }

  setRecordingSetting(key: TRecordingProperty, value: unknown) {
    this.outputs.recording[key] = value;
    this.SET_SETTING('recording', key, value);
  }

  setReplaySetting(key: TReplayProperty, value: unknown) {
    this.outputs.replay[key] = value;
    this.SET_SETTING('replay', key, value);
  }

  startOutput(key: TOutputType) {
    this.outputs[key].start();
    this.activeOutputs.push(key);
  }

  endOutput(key: TOutputType, force?: boolean) {
    this.outputs[key].stop(force);
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
