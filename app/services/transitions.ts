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
  transitions: ITransition[];
  connections: ITransitionConnection[];
  defaultTransitionId: string;
  studioMode: boolean;
}

interface ITransition {
  id: string;
  name: string;
  type: ETransitionType;
  duration: number;
}

interface ITransitionConnection {
  fromSceneId: string;
  toSceneId: string;
  transitionId: string;
}

interface ITransitionCreateOptions {
  id?: string;
  settings?: Dictionary<TObsValue>;
  propertiesManagerSettings?: Dictionary<any>;
  duration?: number;
}

export class TransitionsService extends StatefulService<ITransitionsState> {
  static initialState = {
    transitions: [],
    connections: [],
    defaultTransitionId: null,
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
   * The actual underlying OBS transition objects
   */
  obsTransitions: Dictionary<obs.ITransition> = {};

  /**
   * The properties manager for each transition
   */
  propertiesManagers: Dictionary<DefaultManager> = {};

  init() {
    this.sceneCollectionsService.collectionWillSwitch.subscribe(() => {
      this.disableStudioMode();
    });
  }

  getTypes(): IListOption<ETransitionType>[] {
    return [
      { description: $t('Cut'), value: ETransitionType.Cut },
      { description: $t('Fade'), value: ETransitionType.Fade },
      { description: $t('Swipe'), value: ETransitionType.Swipe },
      { description: $t('Slide'), value: ETransitionType.Slide },
      { description: $t('Fade to Color'), value: ETransitionType.FadeToColor },
      { description: $t('Luma Wipe'), value: ETransitionType.LumaWipe },
      { description: $t('Stinger'), value: ETransitionType.Stinger }
    ];
  }

  enableStudioMode() {
    // if (this.state.studioMode) return;

    // this.SET_STUDIO_MODE(true);
    // if (!this.studioModeTransition) this.createStudioModeTransition();
    // const currentScene = this.scenesService.activeScene.getObsScene();
    // this.sceneDuplicate = currentScene.duplicate(
    //   uuid(),
    //   obs.ESceneDupType.Copy
    // );

    // // Immediately switch to the duplicated scene
    // this.getCurrentTransition().set(this.sceneDuplicate);

    // this.studioModeTransition.set(currentScene);
  }

  disableStudioMode() {
    // if (!this.state.studioMode) return;

    // this.SET_STUDIO_MODE(false);

    // this.getCurrentTransition().set(
    //   this.scenesService.activeScene.getObsScene()
    // );
    // this.releaseStudioModeObjects();
  }

  /**
   * While in studio mode, will execute a studio mode transition
   */
  executeStudioModeTransition() {
    // if (!this.state.studioMode) return;
    // if (this.studioModeLocked) return;

    // this.studioModeLocked = true;

    // const currentScene = this.scenesService.activeScene.getObsScene();

    // const oldDuplicate = this.sceneDuplicate;
    // this.sceneDuplicate = currentScene.duplicate(
    //   uuid(),
    //   obs.ESceneDupType.Copy
    // );
    // this.getCurrentTransition().start(this.state.duration, this.sceneDuplicate);

    // oldDuplicate.release();

    // setTimeout(() => (this.studioModeLocked = false), this.state.duration);
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

  // transitionTo(scene: obs.IScene) {
  //   if (this.state.studioMode) {
  //     this.studioModeTransition.set(scene);
  //     return;
  //   }

  //   const transition = this.getCurrentTransition();
  //   transition.start(this.state.duration, scene);
  // }

  transition(sceneAId: string, sceneBId: string) {
    // TODO: Studio Mode
    // if (this.state.studioMode) {
    //   this.studioModeTransition.set(scene);
    //   return;
    // }

    // TODO: Fetch proper transition from connections rather
    // Than using the default transition
    // Remember that `sceneAId` can be null for the first ever transition
    const obsScene = this.scenesService.getScene(sceneBId).getObsScene();
    const transition = this.getDefaultTransition();
    const obsTransition = this.obsTransitions[transition.id];
    obs.Global.setOutputSource(0, obsTransition);
    obsTransition.start(transition.duration, obsScene);
  }

  shutdown() {
    Object.values(this.obsTransitions).forEach(tran => tran.release());
    this.releaseStudioModeObjects();
    obs.Global.setOutputSource(0, null);
  }

  getDefaultTransition() {
    return this.state.transitions.find(tran => tran.id === this.state.defaultTransitionId);
  }

  getSettings(id: string): Dictionary<TObsValue> {
    return this.obsTransitions[id].settings;
  }

  getPropertiesManagerSettings(id: string): Dictionary<any> {
    return this.propertiesManagers[id].settings;
  }

  getPropertiesFormData(id: string): TFormData {
    return this.propertiesManagers[id].getPropertiesFormData() || [];
  }

  setPropertiesFormData(id: string, formData: TFormData) {
    return this.propertiesManagers[id].setPropertiesFormData(formData);
  }

  createTransition(type: ETransitionType, name: string, options: ITransitionCreateOptions = {}) {
    const id = options.id || uuid();
    const transition = obs.TransitionFactory.create(type, id, options.settings || {});
    const manager = new DefaultManager(transition, options.propertiesManagerSettings || {});

    this.obsTransitions[id] = transition;
    this.propertiesManagers[id] = manager;

    if (!this.state.defaultTransitionId) this.MAKE_DEFAULT(id);

    this.ADD_TRANSITION(id, name, type, options.duration || 300);
    return this.getTransition(id);
  }

  /**
   * Changing the type of a transition actually requires destroying
   * and recreating the underlying OBS transition
   * @param id the transition id
   * @param newType the new transition type
   */
  changeTransitionType(id: string, newType: ETransitionType) {
    const transition = this.getTransition(id);

    this.deleteTransition(id);
    this.createTransition(newType, transition.name, {
      id: transition.id
    });
  }

  renameTransition(id: string, newName: string) {
    this.UPDATE_TRANSITION(id, { name: newName });
  }

  deleteTransition(id: string) {
    this.propertiesManagers[id].destroy();
    delete this.propertiesManagers[id];

    this.obsTransitions[id].release();
    delete this.obsTransitions[id];
    this.DELETE_TRANSITION(id);
  }

  /**
   * Removes all transitions.  This should really only be used when
   * switching scene collections.
   */
  deleteAllTransitions() {
    this.state.transitions.forEach(transition => {
      this.deleteTransition(transition.id);
    });
  }

  setDefaultTransition(id: string) {
    this.MAKE_DEFAULT(id);
  }

  getTransition(id: string) {
    return this.state.transitions.find(tran => tran.id === id);
  }

  // setType(
  //   type: ETransitionType,
  //   settings?: Dictionary<TObsValue>,
  //   propertiesManagerSettings?: Dictionary<any>
  // ) {
  //   const oldTransition = this.getCurrentTransition() as obs.ITransition;
  //   const oldManager = this.propertiesManager;

  //   const transition = this.getTypes().find(transition => {
  //     return transition.value === type;
  //   });

  //   if (transition) {
  //     const newTransition = obs.TransitionFactory.create(
  //       type,
  //       'Global Transition'
  //     );
  //     obs.Global.setOutputSource(0, newTransition);

  //     if (settings) newTransition.update(settings);

  //     this.propertiesManager = new DefaultManager(
  //       newTransition,
  //       propertiesManagerSettings || {}
  //     );

  //     if (oldTransition && oldTransition.getActiveSource) {
  //       newTransition.set(oldTransition.getActiveSource());
  //       oldTransition.release();
  //     }

  //     if (oldManager) oldManager.destroy();

  //     this.SET_TYPE(type);
  //   }
  // }

  setDuration(id: string, duration: number) {
    this.UPDATE_TRANSITION(id, { duration });
  }

  showSceneTransitions() {
    this.windowsService.showWindow({
      componentName: 'SceneTransitions',
      size: {
        width: 800,
        height: 650
      }
    });
  }

  @mutation()
  private ADD_TRANSITION(id: string, name: string, type: ETransitionType, duration: number) {
    this.state.transitions.push({
      id,
      name,
      type,
      duration
    });
  }

  @mutation()
  private UPDATE_TRANSITION(id: string, patch: Partial<ITransition>) {
    const transition = this.state.transitions.find(tran => tran.id === id);

    if (transition) {
      Object.keys(patch).forEach(key => {
        transition[key] = patch[key];
      });
    }
  }

  @mutation()
  private DELETE_TRANSITION(id: string) {
    this.state.transitions = this.state.transitions.filter(
      tran => tran.id !== id
    );

    if (this.state.defaultTransitionId === id) {
      if (this.state.transitions.length > 0) {
        this.state.defaultTransitionId = this.state.transitions[0].id;
      } else {
        this.state.defaultTransitionId = null;
      }
    }
  }

  @mutation()
  private MAKE_DEFAULT(id: string) {
    this.state.defaultTransitionId = id;
  }

  @mutation()
  private SET_STUDIO_MODE(enabled: boolean) {
    this.state.studioMode = enabled;
  }
}
