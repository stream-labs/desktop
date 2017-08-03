import { Node } from './node';
import { ScenesTransitionsService } from '../../scenes-transitions';
import { Inject } from '../../service';

interface ISchema {
  type: string;
  duration: number;
}

export class TransitionNode extends Node<ISchema, {}> {

  schemaVersion = 1;

  @Inject()
  transitionsService: ScenesTransitionsService;

  save() {
    this.data = {
      type: this.transitionsService.state.type,
      duration: this.transitionsService.state.duration
    };
  }

  load() {
    this.transitionsService.setType(this.data.type);
    this.transitionsService.setDuration(this.data.duration);
  }

}
