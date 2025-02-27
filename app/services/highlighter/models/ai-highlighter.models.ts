export type TOrientation = 'horizontal' | 'vertical';

export enum EHighlighterInputTypes {
  KILL = 'kill',
  KNOCKED = 'knocked',
  GAME_SEQUENCE = 'game_sequence',
  GAME_START = 'start_game',
  GAME_END = 'end_game',
  VOICE_ACTIVITY = 'voice_activity',
  DEATH = 'death',
  VICTORY = 'victory',
  DEPLOY = 'deploy',
  META_DURATION = 'meta_duration',
  LOW_HEALTH = 'low_health',
  PLAYER_KNOCKED = 'player_knocked',
}

export interface IHighlight {
  start_time: number;
  end_time: number;
  input_types: EHighlighterInputTypes[];
  inputs: IHighlighterInput[];
  score: number;
  metadata: { round: number; webcam_coordinates: ICoordinates };
}

export interface IAiClipInfo {
  inputs: IInput[];
  score: number;
  metadata: {
    round: number;
    webcam_coordinates: ICoordinates;
  };
}

export interface ICoordinates {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface IDeathMetadata {
  place: number;
}
export interface IKillMetadata {
  bot_kill: boolean;
}

export interface IInput {
  type: EHighlighterInputTypes;
  metadata?: IDeathMetadata | IKillMetadata;
}

export enum EAiDetectionState {
  INITIALIZED = 'initialized',
  IN_PROGRESS = 'detection-in-progress',
  ERROR = 'error',
  FINISHED = 'detection-finished',
  CANCELED_BY_USER = 'detection-canceled-by-user',
}
export interface IHighlighterInput {
  start_time: number;
  end_time?: number;
  type: EHighlighterInputTypes;
  origin: string;
  metadata?: IDeathMetadata | any;
}

// Message
export type EHighlighterMessageTypes =
  | 'progress'
  | 'inputs'
  | 'inputs_partial'
  | 'highlights'
  | 'milestone';

export interface IHighlighterMessage {
  type: EHighlighterMessageTypes;
  json: {};
}

export interface IHighlighterProgressMessage {
  progress: number;
}

export interface IHighlighterMilestone {
  name: string;
  weight: number;
  data: IHighlighterMessage[] | null;
}
