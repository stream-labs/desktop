import { Node } from '../node';
import { ETransitionType, TransitionsService } from 'services/transitions';
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

// TODO: Fix this node
export class TransitionNode extends Node<ISchema, IContext> {
  schemaVersion = 1;

  @Inject() transitionsService: TransitionsService;

  async save(context: IContext) {
    // For overlays, we only store the default transition for now
    const transition = this.transitionsService.getDefaultTransition();
    const type = transition.type;
    const settings = this.transitionsService.getSettings(transition.id);
    const duration = transition.duration;

    const filePath = settings.path as string;

    if (type === 'obs_stinger_transition' && filePath) {
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
      duration,
    };
  }

  async load(context: IContext) {
    this.transitionsService.deleteAllTransitions();

    if (this.data.type === 'obs_stinger_transition') {
      this.data.settings.path = path.join(context.assetsPath, this.data.settings.path);
    }

    this.transitionsService.createTransition(this.data.type, 'Global Transition', {
      settings: this.data.settings,
      duration: this.data.duration,
    });
  }
}
