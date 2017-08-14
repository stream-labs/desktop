import { Service } from '../service';
import { RootNode } from './nodes/overlays/root';
import { ScenesNode } from './nodes/overlays/scenes';
import { SlotsNode } from './nodes/overlays/slots';
import { ImageNode } from './nodes/overlays/image';
import { TextNode } from './nodes/overlays/text';
import { WebcamNode } from './nodes/overlays/webcam';
import { parse } from '.';
import electron from '../../vendor/electron';

const NODE_TYPES = {
  RootNode,
  ScenesNode,
  SlotsNode,
  ImageNode,
  TextNode,
  WebcamNode
};

const fs = window['require']('fs');
const os = window['require']('os');
const path = window['require']('path');
const asar = window['require']('asar');

export class OverlaysPersistenceService extends Service {

  loadOverlay(overlayFilePath: string) {
    const overlayName = path.parse(overlayFilePath).name;
    const assetsPath = path.join(this.overlaysDirectory, overlayName);

    this.ensureOverlaysDirectory();
    asar.extractAll(overlayFilePath, assetsPath);

    const configPath = path.join(assetsPath, 'config.json');
    const data = fs.readFileSync(configPath);
    const root = parse(data, NODE_TYPES);
    root.load({ assetsPath });
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
