enum EncoderType {
  x264 = 0,
  nvenc = 1,
  amd = 2,
  qsv = 3
}

enum GameType {
  PUBG = "PLAYERUNKNOWN'S BATTLEGROUNDS",
  LeagueOfLegends = 'League of Legends',
  Fortnite = 'Fortnite',
  Destiny2 = 'Destiny 2'
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
  preset: PresetType;
}

const CPU_profile: IProfile = {
  profile: 'CPU',
  description:
    'CPU optimized (Reduction of the CPU load for an average video quality)',
  preset: PresetType.veryfast
};

const VQ_profile: IProfile = {
  profile: 'VQ',
  description:
    'Video quality optimized (Improvement of the video quality at a very low CPU usage)',
  preset: PresetType.ultrafast
};

export interface IEncoderPreset {
  profile: IProfile;
  game: GameType;
  settings: string;
  encoder: EncoderType;
}

export const Presets: IEncoderPreset[] = [
  {
    profile: CPU_profile,
    game: GameType.PUBG,
    settings:
      'nal-hrd=cbr trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=1 chroma-qp-offset=0 ' +
      'bframes=3 subme=1 b_adapt=1 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=1 ' +
      'chroma_me=1 psy=1 8x8dct=1 fast_pskip=1 lookahead_threads=6 deblock=1:0',
    encoder: EncoderType.x264
  },
  {
    profile: VQ_profile,
    game: GameType.PUBG,
    settings:
      'nal-hrd=cbr trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=2 chroma-qp-offset=-2 ' +
      'bframes=0 subme=0 b_adapt=2 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=0 ' +
      'chroma_me=1 psy=0 8x8dct=0 fast_pskip=1 lookahead_threads=6 deblock=1:0',
    encoder: EncoderType.x264
  },
  {
    profile: CPU_profile,
    game: GameType.LeagueOfLegends,
    settings:
      'nal-hrd=cbr trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=1 chroma-qp-offset=0 ' +
      'bframes=3 subme=1 b_adapt=1 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=1 ' +
      'chroma_me=1 psy=1 8x8dct=1 fast_pskip=1 lookahead_threads=6 deblock=1:0',
    encoder: EncoderType.x264
  },
  {
    profile: VQ_profile,
    game: GameType.LeagueOfLegends,
    settings:
      'nal-hrd=cbr weightp=1 me_range=16 threads=6 intra_refresh=0 qcomp=0.60 qpmax=69 ' +
      'analyse=\'3:275\' psy_rd=\'1.00:0.00\' ratetol=1.0 qcomp=0.60 deblock=1:0 ' +
      'trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=0 chroma-qp-offset=0 bframes=0 ' +
      'subme=0 b_adapt=0 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=0 chroma_me=1 ' +
      'psy=0 8x8dct=0 fast_pskip=1 lookahead_threads=6',
    encoder: EncoderType.x264
  },
  {
    profile: CPU_profile,
    game: GameType.Fortnite,
    settings:
      'nal-hrd=cbr trellis=0 me=hex force-cfr=1 rc-lookahead=20 ref=1 chroma-qp-offset=0 bframes=3 ' +
      'subme=1 b_adapt=1 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=1 chroma_me=1 psy=1 8x8dct=1 ' +
      'fast_pskip=1 lookahead_threads=6 deblock=1:0',
    encoder: EncoderType.x264
  },
  {
    profile: VQ_profile,
    game: GameType.Fortnite,
    settings:
      'nal-hrd=cbr trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=0 chroma-qp-offset=-2 bframes=0 subme=1 ' +
      'b_adapt=0 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=0 chroma_me=1 psy=1 8x8dct=0 ' +
      'fast_pskip=1 + lookahead_threads=6 deblock=1:0',
    encoder: EncoderType.x264
  },
  {
    profile: CPU_profile,
    game: GameType.Destiny2,
    settings:
      'nal-hrd=cbr trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=1 chroma-qp-offset=0 bframes=3 subme=1 ' +
      'b_adapt=1 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=1 chroma_me=1 psy=1 8x8dct=1 ' +
      ' fast_pskip=1 lookahead_threads=6 deblock=1:0',
    encoder: EncoderType.x264
  },
  {
    profile: VQ_profile,
    game: GameType.Destiny2,
    settings:
      'nal-hrd=cbr trellis=0 me=dia force-cfr=1 rc-lookahead=20 ref=0 chroma-qp-offset=-2 bframes=0 subme=1 ' +
      'b_adapt=0 mixed-refs=0 cabac=1 qpstep=4 b_pyramid=2 mbtree=0 chroma_me=1 psy=1 8x8dct=0 ' +
      'fast_pskip=1 lookahead_threads=6 deblock=1:0',
    encoder: EncoderType.x264
  }
];
