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
  savedAssets: Dictionary<string>;
}

export class IconLibraryNode extends Node<ISchema, IContext> {
  schemaVersion = 1;

  async save(context: IContext) {
    const folder = context.sceneItem.getSource().getPropertiesManagerSettings().folder;
    const newFolderName = uniqueId();

    // Do not duplicate file if it has already been copied
    if (context.savedAssets[folder]) {
      this.data = { folder: context.savedAssets[folder] };
      return;
    }
    context.savedAssets[folder] = newFolderName;

    // Copy the image file
    const destination = path.join(context.assetsPath, newFolderName);

    fs.mkdirSync(destination);

    fs.readdir(folder, (err: Error, files: string[]) => {
      if (err) {
        console.error('error reading icon library directory', err);
        throw err;
      } else {
        files.forEach(file => {
          const filePath = path.join(folder, file);
          if (fs.lstatSync(filePath).isDirectory()) return;
          fs.writeFileSync(path.join(destination, file), fs.readFileSync(filePath));
        });
      }
    });

    this.data = { folder: newFolderName };
  }

  async load(context: IContext) {
    const folder = path.join(context.assetsPath, this.data.folder);
    fs.readdir(folder, (err: Error, files: string[]) => {
      if (err) {
        console.error('error reading icon library directory', err);
        throw err;
      } else {
        const activeIcon = path.join(folder, files[0]);
        context.sceneItem.getSource().setPropertiesManagerSettings({ folder, activeIcon });
      }
    });
  }
}
