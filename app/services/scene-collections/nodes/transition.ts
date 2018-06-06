import { Node } from './node';
import { TransitionsService, ETransitionType } from 'services/transitions';
import { Inject } from 'util/injector';
import { TObsValue } from 'components/shared/forms/Input';

interface ISchema {
  type: ETransitionType;
  duration: number;
  settings?: Dictionary<TObsValue>;
  propertiesManagerSettings?: Dictionary<any>;
}

export class TransitionNode extends Node<ISchema, {}> {

  schemaVersion = 1;

  @Inject() transitionsService: TransitionsService;

  async save() {
    this.data = {
      type: this.transitionsService.state.type,
      duration: this.transitionsService.state.duration,
      settings: this.transitionsService.getSettings(),
      propertiesManagerSettings: this.transitionsService.propertiesManager.settings
    };
  }

  async load() {
    this.transitionsService.setType(
      this.data.type,
      this.data.settings || {},
      this.data.propertiesManagerSettings || {}
    );
    this.transitionsService.setDuration(this.data.duration);
  }

}
