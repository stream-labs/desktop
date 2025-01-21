import path from 'path';
import Utils from 'services/utils';
import { getOS, OS } from 'util/operating-systems';
import * as remote from '@electron/remote';

export const FFMPEG_DIR = Utils.isDevMode()
  ? path.resolve('node_modules', 'obs-studio-node')
  : path.resolve(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'obs-studio-node');

export const FFMPEG_EXE = path.join(
  FFMPEG_DIR,
  getOS() === OS.Mac ? path.join('Frameworks', 'ffmpeg') : 'ffmpeg.exe',
);
export const FFPROBE_EXE = path.join(
  FFMPEG_DIR,
  getOS() === OS.Mac ? path.join('Frameworks', 'ffprobe') : 'ffprobe.exe',
);

/**
 * Enable to use predefined clips instead of pulling from
 * the replay buffer.
 */
export const TEST_MODE = false;

export const SCRUB_WIDTH = 320;
export const SCRUB_HEIGHT = 180;
export const SCRUB_FRAMES = 20;
export const SCRUB_SPRITE_DIRECTORY = path.join(remote.app.getPath('userData'), 'highlighter');

export const FADE_OUT_DURATION = 1;

export const SUPPORTED_FILE_TYPES = ['mp4', 'mov', 'mkv'];
