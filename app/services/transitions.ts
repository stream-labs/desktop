import { mutation, StatefulService } from 'services/stateful-service';
import * as obs from '../../obs-api';
import { Inject } from 'util/injector';
import {
  getPropertiesFormData,
  setPropertiesFormData,
  IListOption,
  TObsValue,
  TFormData
} from 'components/shared/forms/Input';
import { WindowsService } from 'services/windows';
import { ScenesService } from 'services/scenes';

export enum ETransitionType {
  Cut = 'cut_transition',
  Fade = 'fade_transition',
  Swipe = 'swipe_transition',
  Slide = 'slide_transition',
  FadeToColor = 'fade_to_color_transition',
  LumaWipe = 'wipe_transition',
  Stinger = 'obs_stinger_transition'
}

interface ITransitionsState {
  type: ETransitionType;
  duration: number;
  studioMode: boolean;
}

const TRANSITION_TYPES: IListOption<string>[] = [
  { description: 'Cut', value: ETransitionType.Cut },
  { description: 'Fade', value: ETransitionType.Fade },
  { description: 'Swipe', value: ETransitionType.Swipe },
  { description: 'Slide', value: ETransitionType.Slide },
  { description: 'Fade to Color', value: ETransitionType.FadeToColor },
  { description: 'Luma Wipe', value: ETransitionType.LumaWipe },
  { description: 'Stinger', value: ETransitionType.Stinger }
];

export class TransitionsService extends StatefulService<ITransitionsState> {
  static initialState = {
    duration: 300,
    type: ETransitionType.Cut,
    studioMode: false
  } as ITransitionsState;

  @Inject() windowsService: WindowsService;
  @Inject() scenesService: ScenesService;

  studioModeTransition: obs.ITransition;

  init() {
    // Set the default transition type
    this.setType(ETransitionType.Cut);
  }

  enableStudioMode() {
    if (this.state.studioMode) return;

    this.SET_STUDIO_MODE(true);
    if (!this.studioModeTransition) this.createStudioModeTransition();
    const currentScene = this.scenesService.activeScene.getObsScene();
    const sceneDup = currentScene.duplicate('Come up with a better name', obs.ESceneDupType.Refs);

    // Immediately switch to the duplicated scene with a cut transition
    const tempTransition = obs.TransitionFactory.create(
      ETransitionType.Cut,
      'Temp Transition'
    );
    tempTransition.start(300, sceneDup);
    obs.Global.setOutputSource(0, tempTransition);

    this.studioModeTransition.start(300, currentScene);
  }

  /**
   * Creates a basic cut transition used when editing scenes in studio mode
   */
  createStudioModeTransition() {
    this.studioModeTransition = obs.TransitionFactory.create(
      ETransitionType.Cut,
      'Studio Transition'
    );
  }

  transitionTo(scene: obs.IScene) {
    if (this.state.studioMode) {
      this.studioModeTransition.start(300, scene);
      return;
    }

    const transition = this.getCurrentTransition();
    transition.start(this.state.duration, scene);
  }

  release() {
    this.getCurrentTransition().release();
  }

  reset() {
    this.release();
    obs.Global.setOutputSource(0, null);
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


  setType(type: ETransitionType) {
    const oldTransition = this.getCurrentTransition() as obs.ITransition;

    const transition = TRANSITION_TYPES.find(transition => {
      return transition.value === type;
    });

    if (transition) {
      const newTransition = obs.TransitionFactory.create(type, 'Global Transition');
      obs.Global.setOutputSource(0, newTransition);

      if (oldTransition && oldTransition.getActiveSource) {
        newTransition.set(oldTransition.getActiveSource());
        oldTransition.release();
      }

      this.SET_TYPE(type);
    }
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

  @mutation()
  private SET_TYPE(type: ETransitionType) {
    this.state.type = type;
  }

  @mutation()
  private SET_DURATION(duration: number) {
    this.state.duration = duration;
  }

  @mutation()
  private SET_STUDIO_MODE(enabled: boolean) {
    this.state.studioMode = enabled;
  }

}
