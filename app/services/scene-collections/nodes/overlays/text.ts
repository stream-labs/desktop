import { Node } from '../node';
import { SceneItem } from 'services/scenes';
import { FontLibraryService } from 'services/font-library';
import { Inject } from 'services/core/injector';
import path from 'path';
import { byOS, OS } from 'util/operating-systems';
import Utils from 'services/utils';

interface ISchema {
  settings: {
    text: string;
    color: number;
    custom_font: string;
    font: { size: number };
    gradient: boolean;
    gradient_color: number;
    outline: true;
  };
}

interface IContext {
  sceneItem: SceneItem;
  assetsPath: string;
}

export class TextNode extends Node<ISchema, IContext> {
  schemaVersion = 1;

  @Inject() fontLibraryService: FontLibraryService;

  async save(context: IContext) {
    const settings: any = { ...context.sceneItem.getObsInput().settings };

    // We only store the filename for the custom font, to prevent
    // storing a full path that could possibly leak information
    // about a person's computer.
    if (settings['custom_font']) {
      settings['custom_font'] = path.parse(settings['custom_font']).base;
    }

    settings['file'] = '';

    this.data = { settings };
  }

  async load(context: IContext) {
    this.updateInput(context);

    // This is a bit of a hack to force us to immediately download the
    // google font.
    context.sceneItem.getSource().replacePropertiesManager('default', {});
  }

  updateInput(context: IContext) {
    const input = context.sceneItem.getObsInput();

    byOS({
      [OS.Windows]: () => {
        input.update(this.data.settings);
      },
      [OS.Mac]: () => {
        // Translate GDI+ settings to Freetype settings
        const color1 = this.resetAlpha(this.data.settings.color);
        const color2 = this.data.settings.gradient
          ? this.resetAlpha(this.data.settings.gradient_color)
          : this.resetAlpha(this.data.settings.color);

        input.update({
          color1,
          color2,
          custom_font: this.data.settings.custom_font,
          font: this.data.settings.font,
          text: this.data.settings.text,
          outline: this.data.settings.outline,
        });
      },
    });
  }

  /**
   * Forces 100% alpha on a color (used by mac)
   * @param color An integer color
   */
  private resetAlpha(color: number) {
    const rgba = Utils.intToRgba(color);
    return Utils.rgbaToInt(rgba.r, rgba.g, rgba.b, 255);
  }
}
