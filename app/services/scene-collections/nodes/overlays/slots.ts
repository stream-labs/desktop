import { ArrayNode } from '../array-node';
import { SceneItem, Scene, TSceneNode, TSceneNodeType } from 'services/scenes';
import { VideoService } from 'services/video';
import { SourcesService } from 'services/sources';
import { SourceFiltersService, TSourceFilterType } from 'services/source-filters';
import { Inject } from 'util/injector';
import { ImageNode } from './image';
import { TextNode } from './text';
import { WebcamNode } from './webcam';
import { VideoNode } from './video';
import { StreamlabelNode } from './streamlabel';
import { WidgetNode } from './widget';
import * as obs from '../../../../../obs-api';

type TContent =
  | ImageNode
  | TextNode
  | WebcamNode
  | VideoNode
  | StreamlabelNode
  | WidgetNode;

interface IFilterInfo {
  name: string;
  type: string;
  settings: obs.ISettings;
}

interface IItemSchema {
  id: string;
  name: string;
  sceneNodeType: TSceneNodeType;

  x: number;
  y: number;

  // These values are normalized for a 1920x1080 base resolution
  scaleX: number;
  scaleY: number;

  content: TContent;

  filters: IFilterInfo[];
}

export interface IFolderSchema {
  id: string;
  name: string;
  sceneNodeType: TSceneNodeType;
  childrenIds: string[];
}

export type TSlotSchema = IItemSchema | IFolderSchema;

interface IContext {
  assetsPath: string;
  scene: Scene;
}

export class SlotsNode extends ArrayNode<TSlotSchema, IContext, TSceneNode> {
  schemaVersion = 1;

  @Inject() videoService: VideoService;
  @Inject() sourceFiltersService: SourceFiltersService;
  @Inject() sourcesService: SourcesService;

  getItems(context: IContext) {
    return context.scene
      .getNodes()
      .slice()
      .reverse();
  }

  async saveItem(sceneNode: TSceneNode, context: IContext): Promise<TSlotSchema> {

    if (sceneNode.isFolder()) {
      return {
        id: sceneNode.id,
        sceneNodeType: 'folder',
        name: sceneNode.name,
        childrenIds: sceneNode.childrenIds || []
      };
    }

    const sceneItem = sceneNode as SceneItem;

    const details = {
      id: sceneItem.id,
      sceneNodeType: 'item',
      name: sceneItem.name,
      x: sceneItem.transform.position.x / this.videoService.baseWidth,
      y: sceneItem.transform.position.y / this.videoService.baseHeight,
      scaleX: sceneItem.transform.scale.x / this.videoService.baseWidth,
      scaleY: sceneItem.transform.scale.y / this.videoService.baseHeight,
      filters: sceneItem.getObsInput().filters.map(filter => {
        filter.save();

        return {
          name: filter.name,
          type: filter.id,
          settings: filter.settings
        };
      })
    };

    const manager = sceneItem.source.getPropertiesManagerType();

    if (manager === 'streamlabels') {
      const content = new StreamlabelNode();
      await content.save({ sceneItem, assetsPath: context.assetsPath });
      return { ...details, content } as IItemSchema;
    }

    if (manager === 'widget') {
      const content = new WidgetNode();
      await content.save({ sceneItem, assetsPath: context.assetsPath });
      return { ...details, content } as IItemSchema;
    }

    if (sceneItem.type === 'image_source') {
      const content = new ImageNode();
      await content.save({ sceneItem, assetsPath: context.assetsPath });
      return { ...details, content } as IItemSchema;
    }

    if (sceneItem.type === 'text_gdiplus') {
      const content = new TextNode();
      await content.save({ sceneItem, assetsPath: context.assetsPath });
      return { ...details, content } as IItemSchema;
    }

    if (sceneItem.type === 'dshow_input') {
      const content = new WebcamNode();
      await content.save({ sceneItem, assetsPath: context.assetsPath });
      return { ...details, content } as IItemSchema;
    }

    if (sceneItem.type === 'ffmpeg_source') {
      const content = new VideoNode();
      await content.save({ sceneItem, assetsPath: context.assetsPath });
      return { ...details, content } as IItemSchema;
    }
  }

  async loadItem(obj: TSlotSchema, context: IContext): Promise<void> {
    let sceneItem: SceneItem;

    const id = obj.id;

    if (obj.sceneNodeType === 'folder') {
      context.scene.createFolder(obj.name, { id });
      return;
    }

    const sceneItemObj =  obj as IItemSchema;

    if (sceneItemObj.content instanceof WebcamNode) {
      const existingWebcam = this.sourcesService.sources.find(source => {
        return source.type === 'dshow_input';
      });

      if (existingWebcam) {
        sceneItem = context.scene.addSource(existingWebcam.sourceId, { id });
      } else {
        sceneItem = context.scene.createAndAddSource(sceneItemObj.name, 'dshow_input', {}, { id });
      }

      this.adjustPositionAndScale(sceneItem, sceneItemObj);

      await sceneItemObj.content.load({
        sceneItem,
        assetsPath: context.assetsPath,
        existing: existingWebcam !== void 0
      });

      return;
    }

    if (sceneItemObj.content instanceof ImageNode) {
      sceneItem = context.scene.createAndAddSource(sceneItemObj.name, 'image_source', {}, { id });
    } else if (sceneItemObj.content instanceof TextNode) {
      sceneItem = context.scene.createAndAddSource(sceneItemObj.name, 'text_gdiplus', {}, { id });
    } else if (sceneItemObj.content instanceof VideoNode) {
      sceneItem = context.scene.createAndAddSource(sceneItemObj.name, 'ffmpeg_source', {}, { id });
    } else if (sceneItemObj.content instanceof StreamlabelNode) {
      sceneItem = context.scene.createAndAddSource(sceneItemObj.name, 'text_gdiplus', {}, { id });
    } else if (sceneItemObj.content instanceof WidgetNode) {
      sceneItem = context.scene.createAndAddSource(sceneItemObj.name, 'browser_source', {}, { id });
    }

    this.adjustPositionAndScale(sceneItem, sceneItemObj);
    await sceneItemObj.content.load({ sceneItem, assetsPath: context.assetsPath });

    sceneItemObj.filters.forEach(filter => {
      this.sourceFiltersService.add(
        sceneItem.sourceId,
        filter.type as TSourceFilterType,
        filter.name,
        filter.settings
      );
    });
  }

  adjustPositionAndScale(item: SceneItem, obj: IItemSchema) {
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
