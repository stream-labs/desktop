import { Node } from '../node';
import { SceneItem } from '../../../scenes';
import { uniqueId } from 'lodash';
import path from 'path';
import fs from 'fs';

interface ISchema {
  filename: string;
}

interface IContext {
  assetsPath: string;
  sceneItem: SceneItem;
}

export class ImageNode extends Node<ISchema, IContext> {

  schemaVersion = 1;


  save(context: IContext) {
    const filePath = (context.sceneItem.getObsInput().settings as any).file;
    const newFileName = `${uniqueId()}${path.parse(filePath).ext}`;

    // Copy the image file
    // TODO: Allow save to return a promise and use an asynchronous pipe
    const destination = path.join(context.assetsPath, newFileName);
    fs.writeFileSync(destination, fs.readFileSync(filePath));

    this.data = {
      filename: newFileName
    };

    return Promise.resolve();
  }


  load(context: IContext) {
    const filePath = path.join(context.assetsPath, this.data.filename);
    const settings = { ...context.sceneItem.getObsInput().settings };
    settings['file'] = filePath;
    context.sceneItem.getObsInput().update(settings);

    return Promise.resolve();
  }

}
