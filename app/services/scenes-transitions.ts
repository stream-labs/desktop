import { mutation, StatefulService } from './stateful-service';
import { nodeObs } from './obs-api';
import {
  obsValuesToInputValues,
  inputValuesToObsValues,
  IListOption,
  TFormData
} from '../components/shared/forms/Input';

interface ISceneTransitionsState {
  availableTransitions: IListOption[];
  duration: number;
  properties: TFormData;
  currentName: string;
}

const TRANSITION_TYPES: IListOption[] = [
  { description: 'Cut', value: 'cut_transition' },
  { description: 'Fade', value: 'fade_transition' },
  { description: 'Swipe', value: 'swipe_transition' },
  { description: 'Slide', value: 'slide_transition' },
  { description: 'Fade to Color', value: 'fade_to_color_transition' },
  { description: 'Luma Wipe', value: 'wipe_transition' }
];

export default class ScenesTransitionsService extends StatefulService<ISceneTransitionsState> {

  static initialState = {
    availableTransitions: [],
    duration: 0,
    properties: [],
    currentName: '',
  } as ISceneTransitionsState;


  init() {
    this.refresh();

    // create transitions for each type if not exist
    TRANSITION_TYPES.forEach(type => {
      const transition = this.state.availableTransitions.find(transition => transition.value === type.description);
      if (transition) return;
      this.add(type.description, type.value);
    });

    this.refresh();
  }

  @mutation()
  private SET_NAME(name: string) {
    this.state.currentName = name;
  }

  @mutation()
  SET_DURATION(duration: number) {
    this.state.duration = duration;
  }

  @mutation()
  private SET_AVAILABLE_TRANSITIONS(transitions: IListOption[]) {
    this.state.availableTransitions = transitions;
  }

  private refresh() {
    const currentName = nodeObs.OBS_content_getCurrentTransition();
    this.SET_NAME(currentName);
    this.SET_DURATION(nodeObs.OBS_content_getTransitionDuration());
    this.SET_AVAILABLE_TRANSITIONS(nodeObs.OBS_content_getListCurrentTransitions().map((name: string) => {
      return { description: name, value: name };
    }));
  }


  setProperties(properties: TFormData) {
    const propertiesToSave = inputValuesToObsValues(properties, {
      boolToString: true
    });
    for (const prop of propertiesToSave) {
      nodeObs.OBS_content_setTransitionProperty(this.state.currentName, prop.name, prop);
    }
    this.refresh();
  }


  setCurrent(transition: { currentName?: string, duration?: number }) {
    if (transition.currentName) nodeObs.OBS_content_setTransition(transition.currentName);
    if (transition.duration) nodeObs.OBS_content_setTransitionDuration(transition.duration);
    this.refresh();
  }


  private add(transitionName: string, transitionType: string) {
    nodeObs.OBS_content_addTransition(transitionType, transitionName);
  }

  getFormData() {
    return {
      currentName: {
        description: 'Transition',
        name: 'currentName',
        value: this.state.currentName,
        options: this.state.availableTransitions
      },
      duration: {
        description: 'Duration',
        name: 'duration',
        value: this.state.duration
      }
    };
  }

  getPropertiesFormData() {
    const transitionName = this.state.currentName;
    let properties = nodeObs.OBS_content_getTransitionProperties(transitionName);
    if (!properties) return [];

    // patch currentValue for corresponding to common properties format
    properties = obsValuesToInputValues(properties, {
      valueIsObject: true,
      boolIsString: true,
      subParametersGetter: propName => {
        return nodeObs.OBS_content_getTransitionPropertiesSubParameters(transitionName, propName);
      }
    });

    return properties;
  }
}
