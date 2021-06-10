import path from 'path';
import Utils from 'services/utils';
import electron from 'electron';

export const FFMPEG_DIR = Utils.isDevMode()
  ? path.resolve('node_modules', 'ffmpeg-ffprobe-static')
  : path.resolve(process.resourcesPath, 'node_modules', 'ffmpeg-ffprobe-static');

export const FFMPEG_EXE = path.join(FFMPEG_DIR, 'ffmpeg.exe');
export const FFPROBE_EXE = path.join(FFMPEG_DIR, 'ffprobe.exe');

// TODO: Used for test mode only
export const CLIP_DIR = path.resolve('C:/', 'Users', 'acree', 'Videos');

/**
 * Enable to use predefined clips instead of pulling from
 * the replay buffer.
 */
export const TEST_MODE = false;

export const WIDTH = 1280;
export const HEIGHT = 720;
export const FPS = 30;

// Frames are RGBA, 4 bytes per pixel
export const FRAME_BYTE_SIZE = WIDTH * HEIGHT * 4;

export const PREVIEW_WIDTH = 1280 / 4;
export const PREVIEW_HEIGHT = 720 / 4;
export const PREVIEW_FRAME_BYTE_SIZE = PREVIEW_HEIGHT * PREVIEW_HEIGHT * 4;

export const SCRUB_WIDTH = 320;
export const SCRUB_HEIGHT = 180;
export const SCRUB_FRAMES = 20;
export const SCRUB_SPRITE_DIRECTORY = path.join(
  electron.remote.app.getPath('userData'),
  'highlighter',
);
