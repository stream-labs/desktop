import { Node } from '../node';
import { SceneItem } from '../../../scenes';
import { VideoService } from '../../../video';
import { SourcesService } from '../../../sources';
import { sortBy } from 'lodash';
import { IListProperty } from '../../../obs-api';
import { ScalableRectangle } from '../../../../util/ScalableRectangle';

interface ISchema {
  width: number;
  height: number;
}

interface IContext {
  sceneItem: SceneItem;
  assetsPath: string;
}

interface IResolution {
  value: string;
  width: number;
  height: number;
}

export class WebcamNode extends Node<ISchema, IContext> {

  schemaVersion = 1;

  videoService: VideoService = VideoService.instance;
  sourcesService: SourcesService = SourcesService.instance;


  save(context: IContext) {
    const rect = new ScalableRectangle(context.sceneItem);

    this.data = {
      width: rect.scaledWidth / this.videoService.baseWidth,
      height: rect.scaledHeight / this.videoService.baseHeight
    };
  }


  load(context: IContext) {
    const targetWidth = this.data.width * this.videoService.baseWidth;
    const targetHeight = this.data.height * this.videoService.baseHeight;
    const targetAspect = targetWidth / targetHeight;
    const input = context.sceneItem.getObsInput();

    // Select the first video device
    // TODO: Maybe do some string matching to figure out which
    // one is actually the webcam.  For most users, their webcam
    // will be the only option here.
    const deviceProperty = input.properties.get('video_device_id');

    // Stop loading if there aren't any devices
    if ((deviceProperty.details as IListProperty).items.length === 0) return;

    const device = (deviceProperty.details as IListProperty).items[0]['value'];
    const settings = { ...input.settings };

    settings['video_device_id'] = device;
    input.update(settings);

    // Figure out which resolutions this device can run at
    const resolutionDetails = context.sceneItem.getObsInput().properties.get('resolution').details as IListProperty;
    const resolutionOptions = (resolutionDetails.items as any[]).map(item => {
      return this.resStringtoResolution(item.value);
    });

    // Group resolutions by aspect ratio
    const grouped = new Map<number, IResolution[]>();
    resolutionOptions.forEach(res => {
      const ratio = res.width / res.height;
      const values = grouped.get(ratio) || [];
      values.push(res);
      grouped.set(ratio, values);
    });

    let possibleRatios = Array.from(grouped.keys());

    // Cropping width is almost always better than cropping height
    // on a webcam.  Find all aspect ratios bigger than the target.
    const biggerRatios = possibleRatios.filter(ratio => {
      return ratio >= targetAspect;
    });

    // If we found some bigger ratios, restrict to them, otherwise all are ok
    if (biggerRatios.length > 0) possibleRatios = biggerRatios;

    // Turn our list of possible ratios into a list of possible resolutions
    let possibleResolutions: IResolution[] = [];
    possibleRatios.forEach(ratio => {
      const resolutions = grouped.get(ratio);
      possibleResolutions = possibleResolutions.concat(resolutions);
    });

    // Find the smallest width larger than our target
    const sorted = sortBy(possibleResolutions, 'width');

    let bestResolution = sorted.find(res => {
      return res.width > targetWidth;
    });

    // Otherwise, pick the biggest width
    if (!bestResolution) bestResolution = sorted.reverse()[0];

    // Figure out how far we have to scale it
    const scale = targetHeight / bestResolution.height;

    // Crop the width down to size
    const crop: ICrop = {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    };

    if ((bestResolution.width * scale) > targetWidth) {
      const delta = ((bestResolution.width * scale) - targetWidth) / scale;

      crop.left = delta / 2;
      crop.right = delta / 2;
    }

    this.applyResolution(
      context.sceneItem,
      bestResolution.value,
      scale,
      crop
    );
  }


  applyResolution(sceneItem: SceneItem, resolution: string, scale: number, crop: ICrop) {
    const input = sceneItem.getObsInput();
    const settings = { ...input.settings };

    // Custom resolution
    settings['res_type'] = 1;
    settings['resolution'] = resolution;

    input.update(settings);

    sceneItem.setPositionAndScale(
      sceneItem.x,
      sceneItem.y,
      scale,
      scale
    );

    sceneItem.setCrop(crop);
  }


  resStringtoResolution(resString: string): IResolution {
    const parts = resString.split('x');
    return {
      value: resString,
      width: parseInt(parts[0], 10),
      height: parseInt(parts[1], 10)
    };
  }

}
