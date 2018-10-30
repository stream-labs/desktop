import { EEncoder } from 'services/settings';

export interface IEncoderProfile {
  game: string;
  encoder: EEncoder;
  bitrateMin: number;
  bitrateMax: number;
  preset: string;
  resolutionIn: string;
  resolutionOut: string;
  options: string;
}
