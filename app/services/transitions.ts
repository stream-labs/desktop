import { mutation, StatefulService } from 'services/stateful-service';
import * as obs from '../../obs-api';
import { Inject } from 'util/injector';
import {
  IListOption,
  TObsValue,
  TFormData
} from 'components/shared/forms/Input';
import { WindowsService } from 'services/windows';
import { ScenesService } from 'services/scenes';
import uuid from 'uuid/v4';
import { SceneCollectionsService } from 'services/scene-collections';
import { $t } from 'services/i18n';
import { DefaultManager } from 'services/sources/properties-managers/default-manager';

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


export class TransitionsService extends StatefulService<ITransitionsState> {
  static initialState = {
    duration: 300,
    type: ETransitionType.Cut,
    studioMode: false
  } as ITransitionsState;

  @Inject() windowsService: WindowsService;
  @Inject() scenesService: ScenesService;
  @Inject() sceneCollectionsService: SceneCollectionsService;

  /**
   * This transition is used to render the left (EDIT) display
   * while in studio mode
   */
  studioModeTransition: obs.ITransition;

  /**
   * This is a duplicate of the current scene that is rendered
   * to the output while editing is taking place in studio mode.
   */
  sceneDuplicate: obs.IScene;

  /**
   * Used to prevent studio mode transitions before the current
   * one is complete.
   */
  studioModeLocked = false;

  /**
   * The properties manager for the currently set global transition
   */
  propertiesManager: DefaultManager = null;

  init() {
    // Set the default transition type
    this.setType(ETransitionType.Cut);

    this.sceneCollectionsService.collectionWillSwitch.subscribe(() => {
      this.disableStudioMode();
    });
  }

  getTypes(): IListOption<string>[] {
    return [
      { description: $t('transitions.cut_transition'), value: 'cut_transition' },
      { description: $t('transitions.fade_transition'), value: 'fade_transition' },
      { description: $t('transitions.swipe_transition'), value: 'swipe_transition' },
      { description: $t('transitions.slide_transition'), value: 'slide_transition' },
      { description: $t('transitions.fade_to_color_transition'), value: 'fade_to_color_transition' },
      { description: $t('transitions.wipe_transition'), value: 'wipe_transition' },
      { description: $t('transitions.obs_stinger_transition'), value: 'obs_stinger_transition' }
    ];
  }

  enableStudioMode() {
    if (this.state.studioMode) return;

    this.SET_STUDIO_MODE(true);
    if (!this.studioModeTransition) this.createStudioModeTransition();
    const currentScene = this.scenesService.activeScene.getObsScene();
    this.sceneDuplicate = currentScene.duplicate(uuid(), obs.ESceneDupType.Copy);

    // Immediately switch to the duplicated scene
    this.getCurrentTransition().set(this.sceneDuplicate);

    this.studioModeTransition.set(currentScene);
  }

  disableStudioMode() {
    if (!this.state.studioMode) return;

    this.SET_STUDIO_MODE(false);

    this.getCurrentTransition().set(this.scenesService.activeScene.getObsScene());
    this.releaseStudioModeObjects();
  }

  /**
   * While in studio mode, will execute a studio mode transition
   */
  executeStudioModeTransition() {
    if (!this.state.studioMode) return;
    if (this.studioModeLocked) return;

    this.studioModeLocked = true;

    const currentScene = this.scenesService.activeScene.getObsScene();

    const oldDuplicate = this.sceneDuplicate;
    this.sceneDuplicate = currentScene.duplicate(uuid(), obs.ESceneDupType.Copy);
    this.getCurrentTransition().start(this.state.duration, this.sceneDuplicate);

    oldDuplicate.release();

    setTimeout(() => this.studioModeLocked = false, this.state.duration);
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

  releaseStudioModeObjects() {
    if (this.studioModeTransition) {
      this.studioModeTransition.release();
      this.studioModeTransition = null;
    }
    if (this.sceneDuplicate) {
      this.sceneDuplicate.release();
      this.sceneDuplicate = null;
    }
  }

  transitionTo(scene: obs.IScene) {
    if (this.state.studioMode) {
      this.studioModeTransition.set(scene);
      return;
    }

    const transition = this.getCurrentTransition();
    transition.start(this.state.duration, scene);
  }

  release() {
    this.getCurrentTransition().release();
    this.releaseStudioModeObjects();
  }

  reset() {
    this.release();
    obs.Global.setOutputSource(0, null);
  }

  getSettings(): Dictionary<TObsValue> {
    return this.getCurrentTransition().settings;
  }

  getPropertiesFormData(): TFormData {
    return this.propertiesManager.getPropertiesFormData() || [];
  }

  setPropertiesFormData(formData: TFormData) {
    return this.propertiesManager.setPropertiesFormData(formData);
  }

  private getCurrentTransition() {
    return obs.Global.getOutputSource(0) as obs.ITransition;
  }


  setType(type: ETransitionType, settings?: Dictionary<TObsValue>, propertiesManagerSettings?: Dictionary<any>) {
    const oldTransition = this.getCurrentTransition() as obs.ITransition;
    const oldManager = this.propertiesManager;

    const transition = this.getTypes().find(transition => {
      return transition.value === type;
    });

    if (transition) {
      const newTransition = obs.TransitionFactory.create(type, 'Global Transition');
      obs.Global.setOutputSource(0, newTransition);

      if (settings) newTransition.update(settings);

      this.propertiesManager = new DefaultManager(newTransition, propertiesManagerSettings || {});

      if (oldTransition && oldTransition.getActiveSource) {
        newTransition.set(oldTransition.getActiveSource());
        oldTransition.release();
      }

      if (oldManager) oldManager.destroy();

      this.SET_TYPE(type);
    }
  }

  setDuration(duration: number) {
    this.SET_DURATION(duration);
  }

  getFormData() {
    return {
      type: {
        description: $t('transitions.transition'),
        name: 'type',
        value: this.state.type,
        options: this.getTypes()
      },
      duration: {
        description: $t('transitions.duration'),
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
