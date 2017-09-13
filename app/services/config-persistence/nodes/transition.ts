import { Node } from './node';
import { ScenesTransitionsService } from '../../scenes-transitions';
import { Inject } from '../../../util/injector';

interface ISchema {
  type: string;
  duration: number;
}

export class TransitionNode extends Node<ISchema, {}> {

  schemaVersion = 1;

  @Inject('ScenesTransitionsService')
  transitionsService: ScenesTransitionsService;

  save() {
    this.data = {
      type: this.transitionsService.state.type,
      duration: this.transitionsService.state.duration
    };
    return Promise.resolve();
  }

  load() {
    this.transitionsService.setType(this.data.type);
    this.transitionsService.setDuration(this.data.duration);
    return Promise.resolve();
  }

}
