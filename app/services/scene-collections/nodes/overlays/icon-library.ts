import { Node } from '../node';
import { SceneItem } from '../../../scenes';
import uniqueId from 'lodash/uniqueId';
import path from 'path';
import fs from 'fs';

interface ISchema {
  folder: string;
}

interface IContext {
  assetsPath: string;
  sceneItem: SceneItem;
}

export class IconLibraryNode extends Node<ISchema, IContext> {
  schemaVersion = 1;

  async save(context: IContext) {
    const folder = context.sceneItem.getSource().getPropertiesManagerSettings().folder;
    const newFolderName = uniqueId();

    // Copy the image file
    const destination = path.join(context.assetsPath, newFolderName);

    fs.mkdirSync(destination);

    fs.readdir(folder, (err: Error, files: string[]) => {
      files.forEach(file => {
        const filePath = path.join(folder, file);
        fs.writeFileSync(path.join(destination, file), fs.readFileSync(filePath));
      });
    });

    this.data = {
      folder: newFolderName,
    };
  }

  async load(context: IContext) {
    const folder = path.join(context.assetsPath, this.data.folder);
    fs.readdir(folder, (err: Error, files: string[]) => {
      const activeIcon = path.join(folder, files[0]);
      context.sceneItem.getSource().setPropertiesManagerSettings({ folder, activeIcon });
    });
  }
}
