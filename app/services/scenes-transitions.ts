import { mutation, StatefulService } from './stateful-service';
import * as obs from '../../obs-api';
import {
  getPropertiesFormData,
  IListOption, setPropertiesFormData,
  TFormData, TObsValue
} from '../components/shared/forms/Input';
import { Inject } from '../util/injector';
import { WindowsService } from './windows';

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
  { description: 'Luma Wipe', value: 'wipe_transition' },
  { description: 'Stinger', value: 'obs_stinger_transition' }
];

export class ScenesTransitionsService extends StatefulService<ISceneTransitionsState> {

  static initialState = {
    duration: 300,
    type: '',
  } as ISceneTransitionsState;

  @Inject()
  windowsService: WindowsService;


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


  transitionTo(scene: obs.IScene) {
    const transition = this.getCurrentTransition();
    transition.start(this.state.duration, scene);
  }


  release() {
    this.getCurrentTransition().release();
  }

  getSettings(): Dictionary<TObsValue> {
    return this.getCurrentTransition().settings;
  }

  setSettings(settings: Dictionary<TObsValue>)  {
    this.getCurrentTransition().update(settings);
  }

  getPropertiesFormData(): TFormData {
    return getPropertiesFormData(this.getCurrentTransition()) || [];
  }

  setPropertiesFormData(formData: TFormData) {
    return setPropertiesFormData(this.getCurrentTransition(), formData);
  }



  private getCurrentTransition() {
    return obs.Global.getOutputSource(0) as obs.ITransition;
  }


  setType(type: string) {
    const oldTransition = this.getCurrentTransition() as obs.ITransition;
    const newTransition = obs.TransitionFactory.create(type, 'Global Transition');

    obs.Global.setOutputSource(0, newTransition);

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


  showSceneTransitions() {
    this.windowsService.showWindow({
      componentName: 'SceneTransitions',
      size: {
        width: 500,
        height: 600
      }
    });
  }
}
