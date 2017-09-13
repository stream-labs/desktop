import { Node } from '../node';
import { SceneItem } from '../../../scenes';
import { uniqueId } from 'lodash';
import path from 'path';
import fs from 'fs';

interface ISchema {
  settings: object;
  filename: string;
}

interface IContext {
  assetsPath: string;
  sceneItem: SceneItem;
}

export class VideoNode extends Node<ISchema, IContext> {

  schemaVersion = 1;


  save(context: IContext) {
    const filePath = context.sceneItem.getObsInput().settings['local_file'];
    const newFileName = `${uniqueId()}${path.parse(filePath).ext}`;

    // Copy the video file
    // TODO: Now that config loading is asynchronous, do not use blocking file IO
    const destination = path.join(context.assetsPath, newFileName);
    fs.writeFileSync(destination, fs.readFileSync(filePath));

    const settings = { ...context.sceneItem.getObsInput().settings };
    settings['local_file'] = '';

    this.data = {
      settings,
      filename: newFileName
    };

    return Promise.resolve();
  }


  load(context: IContext) {
    const filePath = path.join(context.assetsPath, this.data.filename);
    const settings = { ...this.data.settings };
    settings['local_file'] = filePath;
    context.sceneItem.getObsInput().update(settings);

    return Promise.resolve();
  }

}
