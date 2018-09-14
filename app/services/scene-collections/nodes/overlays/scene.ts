import { Node } from '../node';
import { SceneItem } from 'services/scenes';

interface ISceneNodeSchema {
  sceneId: string;
}

interface IContext {
  sceneItem: SceneItem;
  assetsPath: string;
}

export class SceneSourceNode extends Node<ISceneNodeSchema, IContext> {
  schemaVersion = 1;

  async save(context: IContext) {
    this.data = { sceneId: context.sceneItem.sourceId }
  }

  async load(context: IContext) {
    const settings = { ...context.sceneItem.getObsInput().settings };
    context.sceneItem.getObsInput().update(settings);
  }
}
//
// import { Node } from '../node';
// import { SceneItem } from '../../../scenes';
// import { uniqueId } from 'lodash';
// import path from 'path';
// import fs from 'fs';
//
// interface ISchema {
//   filename: string;
//   sceneId: string;
// }
//
// interface IContext {
//   assetsPath: string;
//   sceneItem: SceneItem;
// }
//
// export class SceneSourceNode extends Node<ISchema, IContext> {
//   schemaVersion = 1;
//
//   async save(context: IContext) {
//     const filePath = (context.sceneItem.getObsInput().settings as any).file;
//     const newFileName = `${uniqueId()}${path.parse(filePath).ext}`;
//
//     // Copy the image file
//     const destination = path.join(context.assetsPath, newFileName);
//     fs.writeFileSync(destination, fs.readFileSync(filePath));
//
//     this.data = {
//       filename: newFileName,
//       sceneId: newFileName
//     };
//   }
//
//   async load(context: IContext) {
//     // const filePath = path.join(context.assetsPath, this.data.filename);
//     // const settings = { ...context.sceneItem.getObsInput().settings };
//     // settings['file'] = filePath;
//     // context.sceneItem.getObsInput().update(settings);
//     //
//     // // This is a bit of a hack to force us to immediately back up
//     // // the media upon overlay install.
//     // context.sceneItem.getSource().replacePropertiesManager('default', {});
//   }
// }
//
