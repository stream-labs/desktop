import { isAbsolute, relative, basename, dirname, resolve } from 'path';
import { remote } from 'electron';
import { ISourceInfo } from './sources';

function getPresetBasePath() {
  const execFile = basename(process.execPath).toLowerCase()
  const isPackaged = execFile !== 'electron.exe';

  const APP_PATH = remote.app.getAppPath();
  const EXE_DIR_PATH = dirname(remote.app.getPath('exe'));
  return isPackaged ? EXE_DIR_PATH : APP_PATH;
}

/** export for testing */
export function convertPresetPath(pathMaybePreset: string, presetBasePath = getPresetBasePath()): string {
  if (isAbsolute(pathMaybePreset)) {
    return pathMaybePreset;
  }

  const isOuterPath = pathMaybePreset.startsWith('..');
  if (isOuterPath) {
    return pathMaybePreset;
  }

  const absolutePath = resolve(presetBasePath, pathMaybePreset);
  return absolutePath;
}

/** export for testing */
export function revertPresetPath(pathMaybePreset: string, presetBasePath = getPresetBasePath()): string {
  if (!isAbsolute(pathMaybePreset)) {
    return pathMaybePreset;
  }

  const relativePath = relative(presetBasePath, pathMaybePreset);
  // Files in another drive or in a network drive
  if (isAbsolute(relativePath)) {
    return pathMaybePreset;
  }

  const isOuterPath = relativePath.startsWith('..');
  if (isOuterPath) {
    return pathMaybePreset;
  }

  return relativePath;
}

/** プリセットのファイル参照をつねにexeから相対パスとして解釈する */
export function applyPathConvertForPreset(
  sourceType: ISourceInfo['type'],
  settings: ISourceInfo['settings']
): ISourceInfo['settings'] {
  if (sourceType === 'image_source' && typeof settings.file === 'string') {
    settings.file = convertPresetPath(settings.file);
  }
  return settings;
}

export function unapplyPathConvertForPreset(
  sourceType: ISourceInfo['type'],
  settings: ISourceInfo['settings']
): ISourceInfo['settings'] {
  if (sourceType === 'image_source' && typeof settings.file === 'string') {
    settings.file = revertPresetPath(settings.file);
  }
  return settings;
}

