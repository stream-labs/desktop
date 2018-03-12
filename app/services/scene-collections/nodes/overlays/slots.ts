import { ArrayNode } from '../array-node';
import { SceneItem, Scene } from '../../../scenes';
import { VideoService } from '../../../video';
import { SourcesService } from '../../../sources';
import { Inject } from '../../../../util/injector';
import { ImageNode } from './image';
import { TextNode } from './text';
import { WebcamNode } from './webcam';
import { VideoNode } from './video';
import { StreamlabelNode } from './streamlabel';
import { WidgetNode } from './widget';

type TContent =
  | ImageNode
  | TextNode
  | WebcamNode
  | VideoNode
  | StreamlabelNode
  | WidgetNode;

interface ISchema {
  name: string;

  x: number;
  y: number;

  // These values are normalized for a 1920x1080 base resolution
  scaleX: number;
  scaleY: number;

  content: TContent;
}

interface IContext {
  assetsPath: string;
  scene: Scene;
}

export class SlotsNode extends ArrayNode<ISchema, IContext, SceneItem> {
  schemaVersion = 1;

  @Inject() videoService: VideoService;

  @Inject() sourcesService: SourcesService;

  getItems(context: IContext) {
    return context.scene
      .getItems()
      .slice()
      .reverse();
  }

  async saveItem(sceneItem: SceneItem, context: IContext): Promise<ISchema> {
    const details = {
      name: sceneItem.name,
      x: sceneItem.transform.position.x / this.videoService.baseWidth,
      y: sceneItem.transform.position.y / this.videoService.baseHeight,
      scaleX: sceneItem.transform.scale.x / this.videoService.baseWidth,
      scaleY: sceneItem.transform.scale.y / this.videoService.baseHeight
    };

    const manager = sceneItem.source.getPropertiesManagerType();

    if (manager === 'streamlabels') {
      const content = new StreamlabelNode();
      await content.save({ sceneItem, assetsPath: context.assetsPath });
      return { ...details, content };
    }

    if (manager === 'widget') {
      const content = new WidgetNode();
      await content.save({ sceneItem, assetsPath: context.assetsPath });
      return { ...details, content };
    }

    if (sceneItem.type === 'image_source') {
      const content = new ImageNode();
      await content.save({ sceneItem, assetsPath: context.assetsPath });
      return { ...details, content };
    }

    if (sceneItem.type === 'text_gdiplus') {
      const content = new TextNode();
      await content.save({ sceneItem, assetsPath: context.assetsPath });
      return { ...details, content };
    }

    if (sceneItem.type === 'dshow_input') {
      const content = new WebcamNode();
      await content.save({ sceneItem, assetsPath: context.assetsPath });
      return { ...details, content };
    }

    if (sceneItem.type === 'ffmpeg_source') {
      const content = new VideoNode();
      await content.save({ sceneItem, assetsPath: context.assetsPath });
      return { ...details, content };
    }
  }

  async loadItem(obj: ISchema, context: IContext): Promise<void> {
    let sceneItem: SceneItem;

    if (obj.content instanceof WebcamNode) {
      const existingWebcam = this.sourcesService.sources.find(source => {
        return source.type === 'dshow_input';
      });

      if (existingWebcam) {
        sceneItem = context.scene.addSource(existingWebcam.sourceId);
      } else {
        sceneItem = context.scene.createAndAddSource(obj.name, 'dshow_input');
      }

      this.adjustPositionAndScale(sceneItem, obj);

      await obj.content.load({
        sceneItem,
        assetsPath: context.assetsPath,
        existing: existingWebcam !== void 0
      });

      return;
    }

    if (obj.content instanceof ImageNode) {
      sceneItem = context.scene.createAndAddSource(obj.name, 'image_source');
    } else if (obj.content instanceof TextNode) {
      sceneItem = context.scene.createAndAddSource(obj.name, 'text_gdiplus');
    } else if (obj.content instanceof VideoNode) {
      sceneItem = context.scene.createAndAddSource(obj.name, 'ffmpeg_source');
    } else if (obj.content instanceof StreamlabelNode) {
      sceneItem = context.scene.createAndAddSource(obj.name, 'text_gdiplus');
    } else if (obj.content instanceof WidgetNode) {
      sceneItem = context.scene.createAndAddSource(obj.name, 'browser_source');
    }

    this.adjustPositionAndScale(sceneItem, obj);
    await obj.content.load({ sceneItem, assetsPath: context.assetsPath });
  }

  adjustPositionAndScale(item: SceneItem, obj: ISchema) {
    item.setTransform({
      position: {
        x: obj.x * this.videoService.baseWidth,
        y: obj.y * this.videoService.baseHeight,
      },
      scale: {
        x: obj.scaleX * this.videoService.baseWidth,
        y: obj.scaleY * this.videoService.baseHeight
      }
    });
  }

  normalizedScale(scale: number) {
    return scale * (1920 / this.videoService.baseWidth);
  }

  denormalizedScale(scale: number) {
    return scale / (1920 / this.videoService.baseWidth);
  }
}
