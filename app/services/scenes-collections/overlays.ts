import { Service } from '../service';
import { RootNode } from './nodes/overlays/root';
import { ScenesNode } from './nodes/overlays/scenes';
import { SlotsNode } from './nodes/overlays/slots';
import { ImageNode } from './nodes/overlays/image';
import { TextNode } from './nodes/overlays/text';
import { WebcamNode } from './nodes/overlays/webcam';
import { VideoNode } from './nodes/overlays/video';
import { ScenesCollectionsService, parse } from '.';
import { Inject } from '../../util/injector';
import electron from 'electron';
import fs from 'fs';
import os from 'os';
import path from 'path';
import asar from 'asar';

const NODE_TYPES = {
  RootNode,
  ScenesNode,
  SlotsNode,
  ImageNode,
  TextNode,
  WebcamNode,
  VideoNode
};

export class OverlaysPersistenceService extends Service {

  @Inject()
  scenesCollectionsService: ScenesCollectionsService;


  loadOverlay(overlayFilePath: string) {
    const overlayName = path.parse(overlayFilePath).name;
    const assetsPath = path.join(this.overlaysDirectory, overlayName);

    this.ensureOverlaysDirectory();
    asar.extractAll(overlayFilePath, assetsPath);

    const configPath = path.join(assetsPath, 'config.json');
    const data = fs.readFileSync(configPath).toString();
    const root = parse(data, NODE_TYPES);
    root.load({ assetsPath });

    this.scenesCollectionsService.setUpDefaultAudio();
  }


  saveOverlay(overlayFilePath: string) {
    const root = new RootNode();
    const assetsPath = fs.mkdtempSync(path.join(os.tmpdir(), 'overlay-assets'));

    root.save({ assetsPath });
    const config = JSON.stringify(root, null, 2);
    const configPath = path.join(assetsPath, 'config.json');
    fs.writeFileSync(configPath, config);

    return new Promise(resolve => {
      asar.createPackage(assetsPath, overlayFilePath, resolve);
    });
  }


  ensureOverlaysDirectory() {
    if (!fs.existsSync(this.overlaysDirectory)) {
      fs.mkdirSync(this.overlaysDirectory);
    }
  }


  get overlaysDirectory() {
    return path.join(electron.remote.app.getPath('userData'), 'Overlays');
  }

}
