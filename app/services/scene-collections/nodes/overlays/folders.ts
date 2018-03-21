// import { ArrayNode } from '../array-node';
// import { SceneItem, Scene, SceneItemFolder } from '../../../scenes';
// import { VideoService } from '../../../video';
// import { SourcesService } from '../../../sources';
// import { Inject } from '../../../../util/injector';
// import { ImageNode } from './image';
// import { TextNode } from './text';
// import { WebcamNode } from './webcam';
// import { VideoNode } from './video';
// import { StreamlabelNode } from './streamlabel';
// import { WidgetNode } from './widget';
//
//
//
// interface ISchema {
//   name: string;
//   nodeInd: number;
//   childrenIds: string[];
// }
//
// interface IContext {
//   assetsPath: string;
//   scene: Scene;
// }
//
// export class FoldersNode extends ArrayNode<ISchema, IContext, SceneItemFolder> {
//   schemaVersion = 1;
//
//   @Inject() videoService: VideoService;
//
//   @Inject() sourcesService: SourcesService;
//
//   getItems(context: IContext) {
//     return context.scene
//       .getFolders()
//       .slice()
//       .reverse();
//   }
//
//   async saveItem(folder: SceneItemFolder, context: IContext): Promise<ISchema> {
//
//     return {
//       name: folder.name,
//       nodeInd: folder.getNodeIndex(),
//       childrenIds: folder.childrenIds
//     };
//
//   }
//
//   async loadItem(obj: ISchema, context: IContext): Promise<void> {
//     let sceneItem: SceneItem;
//
//     context.scene.createFolder(obj.name)
//
//     if (obj.content instanceof WebcamNode) {
//       const existingWebcam = this.sourcesService.sources.find(source => {
//         return source.type === 'dshow_input';
//       });
//
//       if (existingWebcam) {
//         sceneItem = context.scene.addSource(existingWebcam.sourceId);
//       } else {
//         sceneItem = context.scene.createAndAddSource(obj.name, 'dshow_input');
//       }
//
//       this.adjustPositionAndScale(sceneItem, obj);
//
//       await obj.content.load({
//         sceneItem,
//         assetsPath: context.assetsPath,
//         existing: existingWebcam !== void 0
//       });
//
//       return;
//     }
//
//     if (obj.content instanceof ImageNode) {
//       sceneItem = context.scene.createAndAddSource(obj.name, 'image_source');
//     } else if (obj.content instanceof TextNode) {
//       sceneItem = context.scene.createAndAddSource(obj.name, 'text_gdiplus');
//     } else if (obj.content instanceof VideoNode) {
//       sceneItem = context.scene.createAndAddSource(obj.name, 'ffmpeg_source');
//     } else if (obj.content instanceof StreamlabelNode) {
//       sceneItem = context.scene.createAndAddSource(obj.name, 'text_gdiplus');
//     } else if (obj.content instanceof WidgetNode) {
//       sceneItem = context.scene.createAndAddSource(obj.name, 'browser_source');
//     }
//
//     this.adjustPositionAndScale(sceneItem, obj);
//     await obj.content.load({ sceneItem, assetsPath: context.assetsPath });
//   }
//
//   adjustPositionAndScale(item: SceneItem, obj: ISchema) {
//     item.setTransform({
//       position: {
//         x: obj.x * this.videoService.baseWidth,
//         y: obj.y * this.videoService.baseHeight,
//       },
//       scale: {
//         x: obj.scaleX * this.videoService.baseWidth,
//         y: obj.scaleY * this.videoService.baseHeight
//       }
//     });
//   }
//
//   normalizedScale(scale: number) {
//     return scale * (1920 / this.videoService.baseWidth);
//   }
//
//   denormalizedScale(scale: number) {
//     return scale / (1920 / this.videoService.baseWidth);
//   }
// }
