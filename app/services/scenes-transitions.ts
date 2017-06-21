import Obs from '../api/Obs';
import { mutation, StatefulService } from './stateful-service';
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
    const currentName = Obs.getSceneTransitionName();
    this.SET_NAME(currentName);
    this.SET_DURATION(Obs.getSceneTransitionDuration());
    this.SET_AVAILABLE_TYPES(Obs.getSceneTransitionTypes().map((item: { description: string, type: string }) => {
      return { description: item.description, value: item.type };
    }));
    this.SET_AVAILABLE_NAMES(Obs.getSceneTransitionNames().map((name: string) => {
      return { description: name, value: name };
    }));
    this.SET_PROPERTIES(Obs.getSceneTransitionProperties(currentName));
  }


  setProperties(properties: TFormData) {
    const propertiesToSave = inputValuesToObsValues(properties, {
      boolToString: true
    });
    for (const prop of propertiesToSave) {
      Obs.setSceneTransitionProperty(this.state.currentName, prop.name, prop.value);
    }
    this.refresh();
  }


  setCurrent(transition: { currentName?: string, duration?: number }) {
    if (transition.currentName) Obs.setSceneTransitionName(transition.currentName);
    if (transition.duration) Obs.setSceneTransitionDuration(transition.duration);
    this.refresh();
  }


  add(transitionName: string, transitionType: string) {
    Obs.addSceneTransition(transitionType, transitionName);
    Obs.setSceneTransitionName(transitionName);
    this.refresh();
  }


  remove(name: string) {
    Obs.removeSceneTransition(name);
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
    let properties = Obs.getSceneTransitionProperties(transitionName);
    if (!properties) return [];

    // patch currentValue for corresponding to common properties format
    properties = obsValuesToInputValues(properties, {
      valueIsObject: true,
      boolIsString: true,
      subParametersGetter: propName => {
        return Obs.getSceneTransitionPropertySubParameters(transitionName, propName);
      }
    });

    return properties;
  }
}
