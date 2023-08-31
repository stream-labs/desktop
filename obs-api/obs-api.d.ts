// export * from 'obs-studio-node/module'
export {
  EBlendingMethod,
  EBlendingMode,
  EDeinterlaceFieldOrder,
  EDeinterlaceMode,
  EMonitoringType,
  EFaderType,
  EFontStyle,
  EInteractionFlags,
  EMouseButtonType,
  ENumberType,
  EOutputCode,
  EPathType,
  EPropertyType,
  ERenderingMode,
  EScaleType,
  ESceneDupType,
  ESourceFlags,
  ESourceOutputFlags,
  ETextType,
  EVideoCodes,
  Global,
  IBooleanProperty,
  IButtonProperty,
  ICallbackData,
  IColorProperty,
  IEditableListProperty,
  IFader,
  IFilter,
  IFontProperty,
  IInput,
  IListProperty,
  INumberProperty,
  IPathProperty,
  IProperty,
  IScene,
  ISceneItem,
  ISceneItemInfo,
  ISettings,
  ISource,
  ITextProperty,
  ITimeSpec,
  ITransition,
  IVolmeter,
  FaderFactory,
  FilterFactory,
  IPC,
  InputFactory,
  SceneFactory,
  TransitionFactory,
  VideoFactory,
  VolmeterFactory,
  addItems,
  createSources,
  getSourcesSize,
} from 'obs-studio-node/module';
import { EVideoCodes } from 'obs-studio-node/module';

export const NodeObs: {
  // https://github.com/stream-labs/obs-studio-node/blob/0.23.71/obs-studio-client/source/nodeobs_api.hpp
  OBS_API_initAPI(locale: string, directory: string, version: string, sentryUrl: string): EVideoCodes;
  // OBS_API_destroyOBS_API
  OBS_API_getPerformanceStatistics(): any;
  SetWorkingDirectory(path: string): void;
  InitShutdownSequence(): void;
  // OBS_API_QueryHotkeys
  // OBS_API_ProcessHotkeyStatus
  // SetUsername
  // GetPermissionsStatus
  // RequestPermissions
  // GetBrowserAcceleration
  // SetBrowserAcceleration
  // GetBrowserAccelerationLegacy
  // GetMediaFileCaching
  // SetMediaFileCaching
  // GetMediaFileCachingLegacy
  // GetProcessPriority
  // SetProcessPriority
  // GetProcessPriorityLegacy
  // OBS_API_forceCrash
  // GetForceGPURendering
  // SetForceGPURendering
  // GetForceGPURenderingLegacy

  // GetSdrWhiteLevel
  // SetSdrWhiteLevel
  // GetSdrWhiteLevelLegacy
  // GetHdrNominalPeakLevel
  // SetHdrNominalPeakLevel
  // GetHdrNominalPeakLevelLegacy
  // GetLowLatencyAudioBuffering
  // SetLowLatencyAudioBuffering
  // GetLowLatencyAudioBufferingLegacy


  // https://github.com/stream-labs/obs-studio-node/blob/0.23.71/obs-studio-client/source/callback-manager.cpp
  RegisterSourceCallback(callback: (objs: any[]) => void): void;
  RemoveSourceCallback(): void;


  // https://github.com/stream-labs/obs-studio-node/blob/0.23.71/obs-studio-client/source/nodeobs_service.hpp
  OBS_service_resetVideoContext(): void;
  OBS_service_resetAudioContext(): void;

  OBS_service_startStreaming(): void;
  OBS_service_startRecording(): void;
  OBS_service_startReplayBuffer(): void;
  OBS_service_stopStreaming(flag: boolean): void;
  OBS_service_stopRecording(): void;
  OBS_service_stopReplayBuffer(flag: boolean): void;

  OBS_service_connectOutputSignals(callback: (info: any) => void): void;
  OBS_service_removeCallback(): void;
  OBS_service_processReplayBufferHotkey(): void;
  OBS_service_getLastReplay(): string;
  // OBS_service_getLastRecording
  // OBS_service_splitFile

  // OBS_service_createVirtualWebcam
  // OBS_service_removeVirtualWebcam
  // OBS_service_startVirtualWebcam
  // OBS_service_stopVirtualWebcam
  // OBS_service_installVirtualCamPlugin
  // OBS_service_uninstallVirtualCamPlugin
  // OBS_service_isVirtualCamPluginInstalled


  // https://github.com/stream-labs/obs-studio-node/blob/0.23.71/obs-studio-client/source/nodeobs_display.hpp
  // OBS_content_setDayTheme
  OBS_content_createDisplay(window: Buffer, name: string, renderingMode: number): void;
  OBS_content_destroyDisplay(name: string): void;
  OBS_content_getDisplayPreviewOffset(name: string): IVec2;
  OBS_content_getDisplayPreviewSize(name: string): { width: number; height: number };
  OBS_content_createSourcePreviewDisplay(window: Buffer, sourceId: string, name: string): void;
  OBS_content_resizeDisplay(name: string, width: number, height: number): void;
  OBS_content_moveDisplay(name: string, x: number, y: number): void;
  OBS_content_setPaddingSize(name: string, size: number): void;
  OBS_content_setPaddingColor(name: string, r: number, g: number, b: number): void;
  // OBS_content_setOutlineColor
  // OBS_content_setCropOutlineColor
  OBS_content_setShouldDrawUI(name: string, drawUI: boolean): void;
  OBS_content_setDrawGuideLines(name: string, drawGuideLines: boolean): void;
  // OBS_content_setDrawRotationHandle
  // OBS_content_createIOSurface


  // https://github.com/stream-labs/obs-studio-node/blob/0.23.71/obs-studio-client/source/nodeobs_settings.hpp
  OBS_settings_getSettings(categoryName: string): { data: {}[] };
  OBS_settings_saveSettings(categoryName: string, dataToSave: {}[]): void;
  OBS_settings_getListCategories(): string[];
  // OBS_settings_getInputAudioDevices
  // OBS_settings_getOutputAudioDevices
  // OBS_settings_getVideoDevices
};

