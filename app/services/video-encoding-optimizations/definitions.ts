import { EEncoder } from 'services/settings';

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
