import { Node } from '../node';
import { SceneItem } from 'services/scenes';
import { FontLibraryService } from 'services/font-library';
import { Inject } from 'services/core/injector';
import path from 'path';
import { byOS, OS } from 'util/operating-systems';

interface ISchema {
  settings: {
    text: string;
    color: number;
    custom_font: string;
    font: { size: number };
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
        input.update({
          color1: this.data.settings.color,
          // MAC-TODO: Support Google fonts on freetype
          font: { ...input.settings.font, size: this.data.settings.font.size },
          text: this.data.settings.text,
        });
      },
    });
  }
}
