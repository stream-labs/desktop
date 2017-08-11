import { ArrayNode } from '../array-node';
import { SceneItem, Scene } from '../../../scenes';
import { VideoService } from '../../../video';
import { ImageNode } from './image';
import { TextNode } from './text';
import { WebcamNode } from './webcam';

interface ISchema {
  name: string;

  x: number;
  y: number;

  // These values are normalized for a 1920x1080 base resolution
  scaleX: number;
  scaleY: number;

  content: ImageNode | TextNode | WebcamNode;
}

interface IContext {
  assetsPath: string;
  scene: Scene;
}

export class SlotsNode extends ArrayNode<ISchema, IContext, SceneItem> {

  schemaVersion = 1;

  videoService: VideoService = VideoService.instance;


  getItems(context: IContext) {
    return context.scene.getItems().slice().reverse();
  }


  saveItem(sceneItem: SceneItem, context: IContext): ISchema {
    const details = {
      name: sceneItem.name,
      x: sceneItem.x / this.videoService.baseWidth,
      y: sceneItem.y / this.videoService.baseHeight,
      scaleX: sceneItem.scaleX / this.videoService.baseWidth,
      scaleY: sceneItem.scaleY / this.videoService.baseHeight
    };

    if (sceneItem.type === 'image_source') {
      const content = new ImageNode();
      content.save({ sceneItem, assetsPath: context.assetsPath });

      return { ...details, content };
    } else if (sceneItem.type === 'text_gdiplus') {
      const content = new TextNode();
      content.save({ sceneItem, assetsPath: context.assetsPath });

      return { ...details, content };
    } else if (sceneItem.type === 'dshow_input') {
      const content = new WebcamNode();
      content.save({ sceneItem, assetsPath: context.assetsPath });

      return { ...details, content };
    }

    return null;
  }


  loadItem(obj: ISchema, context: IContext) {
    let sceneItem: SceneItem;

    if (obj.content instanceof ImageNode) {
      sceneItem = context.scene.createAndAddSource(obj.name, 'image_source');
    } else if (obj.content instanceof TextNode) {
      sceneItem = context.scene.createAndAddSource(obj.name, 'text_gdiplus');
    } else if (obj.content instanceof WebcamNode) {
      sceneItem = context.scene.createAndAddSource(obj.name, 'dshow_input');
    }

    sceneItem.setPositionAndScale(
      obj.x * this.videoService.baseWidth,
      obj.y * this.videoService.baseHeight,
      obj.scaleX * this.videoService.baseWidth,
      obj.scaleY * this.videoService.baseHeight
    );

    obj.content.load({ sceneItem, assetsPath: context.assetsPath });
  }


  normalizedScale(scale: number) {
    return scale * (1920 / this.videoService.baseWidth);
  }


  denormalizedScale(scale: number) {
    return scale / (1920 / this.videoService.baseWidth);
  }

}
