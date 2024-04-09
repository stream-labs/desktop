// TODO

export const ESourceFlags=  {
  Unbuffered: (1 << 0),
  ForceMono: (1 << 1)
}

const EMonitoringType = {
  None: 0,
  MonitoringOnly: 1,
  MonitoringAndOutput: 2
};

const EOrderMovement = {
  Up: 0,
  Down: 1,
  Top: 2,
  Bottom: 3
};

const EDeinterlaceFieldOrder = {
  Top: 0,
  Bottom: 1
};

const EVideoCodes = {
  Success: 0,
  Fail: -1,
  NotSupported: -2,
  InvalidParam: -3,
  CurrentlyActive: -4,
  ModuleNotFound: -5
};

const EHotkeyObjectType = {
  Frontend: 0,
  Source: 1,
  Output: 2,
  Encoder: 3,
  Service: 4
};

const EDeinterlaceMode = {
  Disable: 0,
  Discard: 1,
  Retro: 2,
  Blend: 3,
  Blend2X: 4,
  Linear: 5,
  Linear2X: 6,
  Yadif: 7,
  Yadif2X: 8
};

const EBlendingMethod = {
  Default: 0,
  SrgbOff: 1
};

const EBlendingMode = {
  Normal: 0,
  Additive: 1,
  Substract: 2,
  Screen: 3,
  Multiply: 4,
  Lighten: 5,
  Darken: 6
};

const EFontStyle = {
  Bold: (1 << 0),
  Italic: (1 << 1),
  Underline: (1 << 2),
  Strikeout: (1 << 3),
};

const EPropertyType = {
  Invalid: 0,
  Boolean: 1,
  Int: 2,
  Float: 3,
  Text: 4,
  Path: 5,
  List: 6,
  Color: 7,
  Button: 8,
  Font: 9,
  EditableList: 10,
  FrameRate: 11,
  Group: 12,
  ColorAlpha: 13,
  Capture: 14,
};

const EListFormat = {
  Invalid: 0,
  Int: 1,
  Float: 2,
  String: 3,
};

const EEditableListType = {
  Strings: 0,
  Files: 1,
  FilesAndUrls: 2,
};

const EPathType = {
  File: 0,
  FileSave: 1,
  Directory: 2,
};

const ETextType = {
  Default: 0,
  Password: 1,
  Multiline: 2,
  TextInfo: 3,
};

const ETextInfoType = {
  Normal: 0,
  Warning: 1,
  Error: 2,
};

const ENumberType = {
  Scroller: 0,
  Slider: 1,
};

const EAlignment = {
  Center: 0,
  Left: 1,
  Right: 2,
  Top: 4,
  Bottom: 8,
  TopLeft: 5,
  TopRight: 6,
  BottomLeft: 9,
  BottomRight: 10
};

const EOutputFlags = {
  Video: 1,
  Audio: 2,
  AV: 3, // (EOutputFlags.Video | EOutputFlags.Audio)
  Encoded: 4,
  Service: 8,
  MultiTrack: 16
};

const ESourceOutputFlags = {
  Video: 1,
  Audio: 2,
  Async: 4,
  AsyncVideo: 5, // (ESourceOutputFlags.Async | ESourceOutputFlags.Video)
  CustomDraw: 8,
  Interaction: 32,
  Composite: 64,
  DoNotDuplicate: 128,
  Deprecated: 256,
  DoNotSelfMonitor: 512,
  ForceUiRefresh: 1073741824 // (1 << 30)
};

const ESceneDupType = {
  Refs: 0,
  Copy: 1,
  PrivateRefs: 2,
  PrivateCopy: 3
};

const ESourceType = {
  Input: 0,
  Filter: 1,
  Transition: 2,
  Scene: 3
};

const EFaderType = {
  Cubic: 0,
  IEC: 1,
  Log: 2
};

const EColorFormat = {
  Unknown: 0,
  A8: 1,
  R8: 2,
  RGBA: 3,
  BGRX: 4,
  BGRA: 5,
  R10G10B10A2: 6,
  RGBA16: 7,
  R16: 8,
  RGBA16F: 9,
  RGBA32F: 10,
  RG16F: 11,
  RG32F: 12,
  DXT1: 13,
  DXT3: 14,
  DXT5: 15
};

const EScaleType = {
  Disable: 0,
  Point: 1,
  Bicubic: 2,
  Bilinear: 3,
  Lanczos: 4,
  Area: 5
};

const EFPSType = {
  Common: 0,
  Integer: 1,
  Fractional: 2
};

const ERangeType = {
  Default: 0,
  Partial: 1,
  Full: 2
};

const EVideoFormat = {
  None: 0,
  I420: 1,
  NV12: 2,
  YVYU: 3,
  YUY2: 4,
  UYVY: 5,
  RGBA: 6,
  BGRA: 7,
  BGRX: 8,
  Y800: 9,
  I444: 10,
  BGR3: 11,
  I422: 12,
  I40A: 13,
  I42A: 14,
  YUVA: 15,
  AYUV: 16
};

const EBoundsType = {
  None: 0,
  Stretch: 1,
  ScaleInner: 2,
  ScaleOuter: 3,
  ScaleToWidth: 4,
  ScaleToHeight: 5,
  MaxOnly: 6
};

const EColorSpace = {
  Default: 0,
  CS601: 1,
  CS709: 2,
  CSSRGB: 3,
  CS2100PQ: 4,
  CS2100HLG: 5
};

const ESpeakerLayout = {
  Unknown: 0,
  Mono: 1,
  Stereo: 2,
  TwoOne: 3,
  Four: 4,
  FourOne: 5,
  FiveOne: 6,
  SevenOne: 8
};

const EOutputCode = {
  Success: 0,
  BadPath: -1,
  ConnectFailed: -2,
  InvalidStream: -3,
  Error: -4,
  Disconnected: -5,
  Unsupported: -6,
  NoSpace: -7,
  EncoderError: -8,
  OutdatedDriver: -65
};

const ECategoryTypes = {
  NODEOBS_CATEGORY_LIST: 0,
  NODEOBS_CATEGORY_TAB: 1
};

const ERenderingMode = {
  OBS_MAIN_RENDERING: 0,
  OBS_STREAMING_RENDERING: 1,
  OBS_RECORDING_RENDERING: 2
};

const EIPCError = {
  STILL_RUNNING: 259,
  VERSION_MISMATCH: 252,
  OTHER_ERROR: 253,
  MISSING_DEPENDENCY: 254,
  NORMAL_EXIT: 0
};

const EVcamInstalledStatus = {
  NotInstalled: 0,
  LegacyInstalled: 1,
  Installed: 2
};

const ERecSplitType = {
  Time: 0,
  Size: 1,
  Manual: 2
};
