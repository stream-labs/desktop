import { Node } from './node';
import { TransitionsService, ETransitionType } from 'services/transitions';
import { Inject } from 'util/injector';
import { TObsValue } from 'components/shared/forms/Input';
import { duration } from 'moment';

interface ISchema {
  type: ETransitionType;
  duration: number;
  settings?: Dictionary<TObsValue>;
  propertiesManagerSettings?: Dictionary<any>;
}

// TODO: Rewrite this entire node for multiple transitions
export class TransitionNode extends Node<ISchema, {}> {

  schemaVersion = 1;

  @Inject() transitionsService: TransitionsService;

  async save() {
    const transition = this.transitionsService.getDefaultTransition();

    this.data = {
      type: transition.type,
      duration: transition.duration,
      settings: this.transitionsService.getSettings(transition.id),
      propertiesManagerSettings: this.transitionsService.getPropertiesManagerSettings(transition.id)
    };
  }

  async load() {
    // TODO: Support for multiple transitions
    this.transitionsService.deleteAllTransitions();
    this.transitionsService.createTransition(
      this.data.type,
      'Global Transition',
      {
        settings: this.data.settings || {},
        propertiesManagerSettings: this.data.propertiesManagerSettings || {},
        duration: this.data.duration
      }
    );
  }

}
