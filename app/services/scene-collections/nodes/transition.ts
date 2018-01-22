import { Node } from './node';
import { ScenesTransitionsService } from '../../scenes-transitions';
import { Inject } from '../../../util/injector';
import { TObsValue } from '../../../components/shared/forms/Input';

interface ISchema {
  type: string;
  duration: number;
  settings?: Dictionary<TObsValue>;
}

export class TransitionNode extends Node<ISchema, {}> {

  schemaVersion = 1;

  @Inject('ScenesTransitionsService')
  transitionsService: ScenesTransitionsService;

  save() {
    this.data = {
      type: this.transitionsService.state.type,
      duration: this.transitionsService.state.duration,
      settings: this.transitionsService.getSettings()
    };
    return Promise.resolve();
  }

  load() {
    this.transitionsService.setType(this.data.type);
    this.transitionsService.setDuration(this.data.duration);
    if (this.data.settings) this.transitionsService.setSettings(this.data.settings);
    return Promise.resolve();
  }

}
