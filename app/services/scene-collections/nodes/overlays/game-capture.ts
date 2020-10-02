import { Node } from '../node';
import { SceneItem } from '../../../scenes';
import uniqueId from 'lodash/uniqueId';
import path from 'path';
import fs from 'fs';

interface ISchema {
  placeholderFile: string;
}

interface IContext {
  assetsPath: string;
  sceneItem: SceneItem;
}

export class GameCaptureNode extends Node<ISchema, IContext> {
  schemaVersion = 1;

  async save(context: IContext) {
    let placeholderFile: string;
    const settings = context.sceneItem.getObsInput().settings;

    if (settings.user_placeholder_image && settings.user_placeholder_use) {
      placeholderFile = `${uniqueId()}${path.parse(settings.user_placeholder_image).ext}`;

      // Copy the placeholder image
      const destination = path.join(context.assetsPath, placeholderFile);
      fs.writeFileSync(destination, fs.readFileSync(settings.user_placeholder_image));
    }

    this.data = { placeholderFile };
  }

  async load(context: IContext) {
    // A custom placeholder is not always provided
    if (!this.data.placeholderFile) return;

    const filePath = path.join(context.assetsPath, this.data.placeholderFile);
    context.sceneItem
      .getObsInput()
      .update({ user_placeholder_image: filePath, user_placeholder_use: true });

    // This is a bit of a hack to force us to immediately back up
    // the media upon overlay install.
    // NOTE: This is not a new hack, this is the same as other theme
    // sources. We can probably clean this up at some point.
    context.sceneItem.getSource().replacePropertiesManager('default', {});
  }
}
