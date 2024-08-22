import { IAiClip, TClip } from 'services/highlighter';

export const isAiClip = (clip: TClip): clip is IAiClip => clip.source === 'AiClip';
