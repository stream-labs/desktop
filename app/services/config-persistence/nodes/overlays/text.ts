import { Node } from '../node';
import { SceneItem } from '../../../scenes';
import { FontLibraryService } from '../../../font-library';
import { Inject } from '../../../../util/injector';
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

  @Inject()
  fontLibraryService: FontLibraryService;


  save(context: IContext) {
    const settings = context.sceneItem.getObsInput().settings;

    // We only store the filename for the custom font, to prevent
    // storing a full path that could possibly leak information
    // about a person's computer.
    if (settings['custom_font']) {
      const file = path.parse(settings['custom_font']).base;
      settings['custom_font'] = file;
    }

    this.data = { settings };
  }


  load(context: IContext) {
    // If a custom font was set, try to load it as a google font.
    // If this fails, not font will be installed and the plugin
    // will automatically fall back to Arial
    if (this.data.settings['custom_font']) {
      this.fontLibraryService.downloadFont(this.data.settings['custom_font'])
        .then(path => {
          this.data.settings['custom_font'] = path;
          this.updateInput(context);
        })
        .catch(() => this.updateInput(context));
    } else {
      this.updateInput(context);
    }
  }


  updateInput(context: IContext) {
    context.sceneItem.getObsInput().update(this.data.settings);
  }

}
