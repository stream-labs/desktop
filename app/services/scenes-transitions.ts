import { mutation, StatefulService } from './stateful-service';
import { nodeObs } from './obs-api';
import {
  obsValuesToInputValues,
  inputValuesToObsValues,
  IListOption,
  TFormData
} from '../components/shared/forms/Input';

interface ISceneTransitionsState {
  availableTypes: IListOption[];
  availableNames: IListOption[];
  duration: number;
  properties: TFormData;
  currentName: string;
}


export default class ScenesTransitionsService extends StatefulService<ISceneTransitionsState> {

  static initialState = {
    availableTypes: [],
    availableNames: [],
    duration: 0,
    properties: [],
    currentName: '',
  } as ISceneTransitionsState;

  init() {
    this.refresh();
  }

  @mutation
  private SET_NAME(name: string) {
    this.state.currentName = name;
  }

  @mutation
  SET_DURATION(duration: number) {
    this.state.duration = duration;
  }

  @mutation
  private SET_AVAILABLE_TYPES(availableTypes: IListOption[]) {
    this.state.availableTypes = availableTypes;
  }

  @mutation
  private SET_AVAILABLE_NAMES(availableNames: IListOption[]) {
    this.state.availableNames = availableNames;
  }

  @mutation
  private SET_PROPERTIES(props: TFormData) {
    this.state.properties = props;
  }

  private refresh() {
    const currentName = nodeObs.OBS_content_getCurrentTransition();
    this.SET_NAME(currentName);
    this.SET_DURATION(nodeObs.OBS_content_getTransitionDuration());
    this.SET_AVAILABLE_TYPES(nodeObs.OBS_content_getListTransitions()
      .map((item: { description: string, type: string }) => {
        return { description: item.description, value: item.type };
      })
    );
    this.SET_AVAILABLE_NAMES(nodeObs.OBS_content_getListCurrentTransitions().map((name: string) => {
      return { description: name, value: name };
    }));
    this.SET_PROPERTIES(nodeObs.OBS_content_setTransitionProperty(currentName));
  }


  setProperties(properties: TFormData) {
    const propertiesToSave = inputValuesToObsValues(properties, {
      boolToString: true
    });
    for (const prop of propertiesToSave) {
      nodeObs.OBS_content_setTransitionProperty(this.state.currentName, prop.name, prop.value);
    }
    this.refresh();
  }


  setCurrent(transition: { currentName?: string, duration?: number }) {
    if (transition.currentName) nodeObs.OBS_content_setTransition(transition.currentName);
    if (transition.duration) nodeObs.OBS_content_setTransitionDuration(transition.duration);
    this.refresh();
  }


  add(transitionName: string, transitionType: string) {
    nodeObs.OBS_content_addTransition(transitionType, transitionName);
    nodeObs.OBS_content_setTransition(transitionName);
    this.refresh();
  }


  remove(name: string) {
    nodeObs.OBS_content_removeTransition(name);
    if (name === this.state.currentName) {
      this.setCurrent({currentName: this.state.availableNames.find(transition => {
        return transition.value !== name;
      }).value});
      return;
    }
    this.refresh();
  }

  getFormData() {
    return {
      currentName: {
        description: 'Transition',
        name: 'currentName',
        value: this.state.currentName,
        options: this.state.availableNames
      },
      duration: {
        description: 'Duration',
        name: 'duration',
        value: this.state.duration
      }
    };
  }

  getAddNewFormData() {
    return {
      type: {
        description: 'Transition type',
        name: 'type',
        value: this.state.availableTypes[0].value,
        options: this.state.availableTypes
      },
      name: {
        description: 'Transition name',
        name: 'name',
        value: ''
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
