import { mutation, StatefulService } from './stateful-service';
import { nodeObs, ObsGlobal, ObsTransition, ObsScene } from './obs-api';
import {
  obsValuesToInputValues,
  inputValuesToObsValues,
  IListOption,
  TFormData
} from '../components/shared/forms/Input';

interface ISceneTransitionsState {
  availableTransitions: IListOption<string>[];
  duration: number;
  properties: TFormData;
  type: string;
}

const TRANSITION_TYPES: IListOption<string>[] = [
  { description: 'Cut', value: 'cut_transition' },
  { description: 'Fade', value: 'fade_transition' },
  { description: 'Swipe', value: 'swipe_transition' },
  { description: 'Slide', value: 'slide_transition' },
  { description: 'Fade to Color', value: 'fade_to_color_transition' },
  { description: 'Luma Wipe', value: 'wipe_transition' }
];

export class ScenesTransitionsService extends StatefulService<ISceneTransitionsState> {

  static initialState = {
    duration: 300,
    type: '',
  } as ISceneTransitionsState;


  init() {
    // Set the default transition type
    this.setType('cut_transition');
  }


  @mutation()
  private SET_TYPE(type: string) {
    this.state.type = type;
  }


  @mutation()
  SET_DURATION(duration: number) {
    this.state.duration = duration;
  }


  transitionTo(scene: ObsScene) {
    const transition = this.getCurrentTransition();
    transition.start(this.state.duration, scene);
  }


  private getCurrentTransition() {
    return ObsGlobal.getOutputSource(0) as ObsTransition;
  }


  setType(type: string) {
    const oldTransition = this.getCurrentTransition() as ObsTransition;
    const newTransition = ObsTransition.create(type, 'Global Transition');

    ObsGlobal.setOutputSource(0, newTransition);

    if (oldTransition && oldTransition.getActiveSource) {
      newTransition.set(oldTransition.getActiveSource());
      oldTransition.release();
    }

    this.SET_TYPE(type);
  }


  setDuration(duration: number) {
    this.SET_DURATION(duration);
  }


  getFormData() {
    return {
      type: {
        description: 'Transition',
        name: 'type',
        value: this.state.type,
        options: TRANSITION_TYPES
      },
      duration: {
        description: 'Duration',
        name: 'duration',
        value: this.state.duration
      }
    };
  }

}
