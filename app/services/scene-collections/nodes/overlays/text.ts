import { Node } from '../node';
import { SceneItem } from '../../../scenes';
import { 
  FontLibraryService, 
  IFontFamily, IFontStyle } from '../../../font-library';
import { Inject } from '../../../../util/injector';
import * as fi from 'node-fontinfo';
import { EFontStyle } from 'obs-studio-node';
import path from 'path';

interface ISchema {
  settings: object;
}

interface IContext {
  sceneItem: SceneItem;
  assetsPath: string;
}

export class TextNode extends Node<ISchema, IContext> {
  schemaVersion = 1;

  @Inject() fontLibraryService: FontLibraryService;

  async save(context: IContext) {
    const settings = { ...context.sceneItem.getObsInput().settings };

    // We only store the filename for the custom font, to prevent
    // storing a full path that could possibly leak information
    // about a person's computer.
    if (settings['custom_font']) {
      const file = path.parse(settings['custom_font']).base;
      settings['custom_font'] = file;
    }

    settings['file'] = '';

    this.data = { settings };
  }

  async load(context: IContext) {
    const settings = this.data.settings;

    // Overlays should always use a custom font, but in case they
    // don't, just leave all the settings as-is
    if (!settings['custom_font']) {
      this.updateInput(context);
      return;
    }

    // If a custom font was set, try to load it as a google font.
    // If this fails, no font will be installed and the plugin
    // will automatically fall back to Arial
    const filename = settings['custom_font'];

    const fontPath =
      await this.fontLibraryService.downloadFont(filename);

    const fontInfo = fi.getFontInfo(fontPath);

    if (!fontInfo) {
      // Fall back to Arial
      delete settings['custom_font'];
      settings['font']['face'] = 'Arial';
      settings['font']['flags'] = 0;
      this.updateInput(context);
      return;
    }

    settings['custom_font'] = fontPath;
    settings['font']['face'] = fontInfo.family_name;
    settings['font']['flags'] =
      (fontInfo.italic ? EFontStyle.Italic : 0) |
      (fontInfo.bold ? EFontStyle.Bold : 0);

    this.updateInput(context);
  }

  updateInput(context: IContext) {
    context.sceneItem.getObsInput().update(this.data.settings);
  }
}
