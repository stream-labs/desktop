import { EEncoder } from 'services/settings';
import { key } from 'aws-sdk/clients/signer';

export interface IEncoderProfile {
  game: string;
  encoder: EEncoder;
  bitrateMin: number;
  bitrateMax: number;
  presetIn: string;
  presetOut: string;
  resolutionIn: string;
  resolutionOut: string;
  options: string;
}

export type TGameProfileType = 'highPerformance' | 'highQuality';

export interface IGameProfiles {
  highPerformance: string;
  highQuality: string;
}
