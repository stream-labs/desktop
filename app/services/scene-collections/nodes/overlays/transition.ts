import { Node } from '../node';
import { TransitionsService, ETransitionType } from 'services/transitions';
import { Inject } from 'util/injector';
import { uniqueId } from 'lodash';
import path from 'path';
import fs from 'fs';

interface ISchema {
  type: ETransitionType;
  duration: number;
  settings?: Dictionary<any>;
}

interface IContext {
  assetsPath: string;
}

export class TransitionNode extends Node<ISchema, IContext> {
  schemaVersion = 1;

  @Inject() transitionsService: TransitionsService;

  async save(context: IContext) {
    const type = this.transitionsService.state.type;
    const settings = { ...this.transitionsService.getSettings() };
    const filePath = settings.path as string;

    if ((type === 'obs_stinger_transition') && filePath) {
      const newFileName = `${uniqueId()}${path.parse(filePath).ext}`;

      const destination = path.join(context.assetsPath, newFileName);
      const input = fs.createReadStream(filePath);
      const output = fs.createWriteStream(destination);

      await new Promise(resolve => {
        output.on('close', resolve);
        input.pipe(output);
      });

      settings.path = newFileName;
    }

    this.data = {
      type,
      settings,
      duration: this.transitionsService.state.duration,
    };
  }

  async load(context: IContext) {
    this.transitionsService.setType(this.data.type);
    this.transitionsService.setDuration(this.data.duration);

    if (this.data.type === 'obs_stinger_transition') {
      const filePath = path.join(context.assetsPath, this.data.settings.path);
      this.data.settings.path = filePath;
    }

    if (this.data.settings) this.transitionsService.setSettings(this.data.settings);
  }
}
