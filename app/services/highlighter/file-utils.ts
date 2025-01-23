import * as fs from 'fs-extra';
import { SCRUB_SPRITE_DIRECTORY } from './constants';
export function extractDateTimeFromPath(filePath: string): string | undefined {
  try {
    const parts = filePath.split(/[/\\]/);
    const fileName = parts[parts.length - 1];
    const dateTimePart = fileName.split('.')[0];
    return dateTimePart;
  } catch (error: unknown) {
    return undefined;
  }
}

export function fileExists(file: string): boolean {
  return fs.existsSync(file);
}

export async function ensureScrubDirectory() {
  try {
    try {
      //If possible to read, directory exists, if not, catch and mkdir
      await fs.readdir(SCRUB_SPRITE_DIRECTORY);
    } catch (error: unknown) {
      await fs.mkdir(SCRUB_SPRITE_DIRECTORY);
    }
  } catch (error: unknown) {
    console.log('Error creating scrub sprite directory');
  }
}
export async function removeScrubFile(clipPath: string) {
  try {
    await fs.remove(clipPath);
  } catch (error: unknown) {
    console.error('Error removing scrub file', error);
  }
}
