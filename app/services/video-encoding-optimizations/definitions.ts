import { $t } from 'services/i18n';
import { int } from 'aws-sdk/clients/datapipeline';
import { TEncoder } from '../settings';

enum EncoderType {
  x264 = 'x264',
  obs_x264 = 'obs_x264',
  nvenc = 'nvenc',
  ffmpeg_nvenc = 'ffmpeg_nvenc',
  amd = 'amd',
  amd_amf_h264 = 'amd_amf_h264',
  qsv = 'qsv',
  obs_qsv11 = 'obs_qsv11'
}

enum GameType {
  PUBG = "PLAYERUNKNOWN'S BATTLEGROUNDS",
  LeagueOfLegends = 'League of Legends',
  Fortnite = 'Fortnite',
  Destiny2 = 'Destiny 2',
  Generic = 'Generic',
}

enum PresetType {
  ultrafast = 'ultrafast',
  superfast = 'superfast',
  veryfast = 'veryfast',
  faster = 'faster',
  fast = 'fast',
  medium = 'medium',
  slow = 'slow',
  slower = 'slower'
}

export interface IProfile {
  profile: string;
  description: string;
  longDescription: string;
  preset: PresetType;
}

const CPU_profile: IProfile = {
  profile: 'CPU',
  description: 'Medium',
  preset: PresetType.veryfast,
  get longDescription() {
    return $t('Optimized profile for average CPUs');
  }
};

const VQ_profile: IProfile = {
  profile: 'VQ',
  description: 'Low',
  preset: PresetType.ultrafast,
  get longDescription() {
    return $t('Optimized profile for weak CPUs');
  }
};

export interface IEncoderPresetDeprecated {
  profile: IProfile;
  game: GameType;
  settings: string;
  encoder: EncoderType[];
}

export const Presets: IEncoderPresetDeprecated[] = [
  {
    profile: CPU_profile,
    game: GameType.PUBG,
    settings:
      'nal-hrd=cbr trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=1 chroma-qp-offset=0 ' +
      'bframes=3 subme=1 b_adapt=1 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=1 ' +
      'chroma_me=1 psy=1 8x8dct=1 fast_pskip=1 lookahead_threads=6 deblock=1:0',
    encoder: [EncoderType.x264, EncoderType.obs_x264]
  },
  {
    profile: VQ_profile,
    game: GameType.PUBG,
    settings:
      'nal-hrd=cbr trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=2 chroma-qp-offset=-2 ' +
      'bframes=0 subme=0 b_adapt=2 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=0 ' +
      'chroma_me=1 psy=0 8x8dct=0 fast_pskip=1 lookahead_threads=6 deblock=1:0',
    encoder: [EncoderType.x264, EncoderType.obs_x264]
  },
  {
    profile: CPU_profile,
    game: GameType.LeagueOfLegends,
    settings:
      'nal-hrd=cbr trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=1 chroma-qp-offset=0 ' +
      'bframes=3 subme=1 b_adapt=1 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=1 ' +
      'chroma_me=1 psy=1 8x8dct=1 fast_pskip=1 lookahead_threads=6 deblock=1:0',
    encoder: [EncoderType.x264, EncoderType.obs_x264]
  },
  {
    profile: VQ_profile,
    game: GameType.LeagueOfLegends,
    settings:
      'nal-hrd=cbr weightp=1 me_range=16 threads=6 intra_refresh=0 qcomp=0.60 qpmax=69 ' +
      "analyse='3:275' psy_rd='1.00:0.00' ratetol=1.0 qcomp=0.60 deblock=1:0 " +
      'trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=0 chroma-qp-offset=0 bframes=0 ' +
      'subme=0 b_adapt=0 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=0 chroma_me=1 ' +
      'psy=0 8x8dct=0 fast_pskip=1 lookahead_threads=6',
    encoder: [EncoderType.x264, EncoderType.obs_x264]
  },
  {
    profile: CPU_profile,
    game: GameType.Fortnite,
    settings:
      'nal-hrd=cbr trellis=0 me=hex force-cfr=1 rc-lookahead=20 ref=1 chroma-qp-offset=0 bframes=3 ' +
      'subme=1 b_adapt=1 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=1 chroma_me=1 psy=1 8x8dct=1 ' +
      'fast_pskip=1 lookahead_threads=6 deblock=1:0',
    encoder: [EncoderType.x264, EncoderType.obs_x264]
  },
  {
    profile: VQ_profile,
    game: GameType.Fortnite,
    settings:
      'nal-hrd=cbr trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=0 chroma-qp-offset=-2 bframes=0 subme=1 ' +
      'b_adapt=0 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=0 chroma_me=1 psy=1 8x8dct=0 ' +
      'fast_pskip=1 lookahead_threads=6 deblock=1:0',
    encoder: [EncoderType.x264, EncoderType.obs_x264]
  },
  {
    profile: CPU_profile,
    game: GameType.Destiny2,
    settings:
      'nal-hrd=cbr trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=1 chroma-qp-offset=0 bframes=3 subme=1 ' +
      'b_adapt=1 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=1 chroma_me=1 psy=1 8x8dct=1 ' +
      'fast_pskip=1 lookahead_threads=6 deblock=1:0',
    encoder: [EncoderType.x264, EncoderType.obs_x264]
  },
  {
    profile: VQ_profile,
    game: GameType.Destiny2,
    settings:
      'nal-hrd=cbr trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=0 chroma-qp-offset=-2 bframes=0 subme=1 ' +
      'b_adapt=0 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=0 chroma_me=1 psy=1 8x8dct=0 ' +
      'fast_pskip=1 lookahead_threads=6 deblock=1:0',
    encoder: [EncoderType.x264, EncoderType.obs_x264]
  },
  {
    profile: CPU_profile,
    game: GameType.Generic,
    settings:
      'nal-hrd=cbr deblock=1:0 trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=1 chroma-qp-offset=0 bframes=2 ' +
      'subme=1 b_adapt=1 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=1 chroma_me=1 psy=1 8x8dct=1 fast_pskip=1 ' +
      'lookahead_threads=6',
    encoder: [EncoderType.x264, EncoderType.obs_x264]
  },
  {
    profile: VQ_profile,
    game: GameType.Generic,
    settings:
      'nal-hrd=cbr deblock=1:0 trellis=0 me=tesa force-cfr=1 rc-lookahead=10 ref=0 chroma-qp-offset=-2 bframes=0 ' +
      'subme=0 b_adapt=0 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=0 chroma_me=1 psy=1 8x8dct=0 fast_pskip=1 ' +
      'lookahead_threads=6',
    encoder: [EncoderType.x264, EncoderType.obs_x264]
  }
];

export interface IEncoderSearchOptions {
  game: string;
  encoder: TEncoder;
  bitrate: number;
  resolution_in: string;
  resolution_out: string;
}

export interface IEncoderProfile {
  game: string;
  encoder: TEncoder;
  bitrateMin: number;
  bitrateMax: number;
  preset: string;
  resolutionIn: string;
  resolutionOut: string;
  options: string;
}
