import { Service } from '../service';
import { RootNode } from './nodes/overlays/root';
import { ScenesNode } from './nodes/overlays/scenes';
import { SlotsNode } from './nodes/overlays/slots';
import { ImageNode } from './nodes/overlays/image';
import { TextNode } from './nodes/overlays/text';
import { WebcamNode } from './nodes/overlays/webcam';
import { VideoNode } from './nodes/overlays/video';
import { StreamlabelNode } from './nodes/overlays/streamlabel';
import { WidgetNode } from './nodes/overlays/widget';
import { ConfigPersistenceService, parse } from '.';
import { Inject } from '../../util/injector';
import electron from 'electron';
import fs from 'fs';
import os from 'os';
import path from 'path';
import unzip from 'unzip';
import archiver from 'archiver';

const NODE_TYPES = {
  RootNode,
  ScenesNode,
  SlotsNode,
  ImageNode,
  TextNode,
  WebcamNode,
  VideoNode,
  StreamlabelNode,
  WidgetNode
};

export class OverlaysPersistenceService extends Service {
  @Inject() configPersistenceService: ConfigPersistenceService;

  async loadOverlay(overlayFilePath: string) {
    const overlayName = path.parse(overlayFilePath).name;
    const assetsPath = path.join(this.overlaysDirectory, overlayName);

    this.ensureOverlaysDirectory();

    await new Promise((resolve, reject) => {
      const inStream = fs.createReadStream(overlayFilePath);
      const outStream = unzip.Extract({ path: assetsPath });

      outStream.on('close', resolve);
      inStream.pipe(outStream);
    });

    const configPath = path.join(assetsPath, 'config.json');
    const data = fs.readFileSync(configPath).toString();
    const root = parse(data, NODE_TYPES);
    root.load({ assetsPath });

    this.configPersistenceService.setUpDefaultAudio();
  }

  async saveOverlay(overlayFilePath: string) {
    const root = new RootNode();
    const assetsPath = fs.mkdtempSync(path.join(os.tmpdir(), 'overlay-assets'));

    await root.save({ assetsPath });
    const config = JSON.stringify(root, null, 2);
    const configPath = path.join(assetsPath, 'config.json');
    fs.writeFileSync(configPath, config);

    const output = fs.createWriteStream(overlayFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise(resolve => {
      output.on('close', (err: any) => {
        resolve();
      });

      archive.pipe(output);
      archive.directory(assetsPath, false);
      archive.finalize();
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
