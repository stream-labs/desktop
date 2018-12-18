import * as path from 'path';
import { getType } from 'mime';
import { apiMethod, EApiPermissions, IApiContext, Module } from './module';
import {
  ETransitionType,
  ITransition,
  ITransitionCreateOptions,
  TransitionsService,
} from 'services/transitions';
import { Inject } from 'util/injector';
import { PlatformAppsService } from '../../index';

type AudioFadeStyle = 'fadeOut' | 'crossFade';

enum ObsAudioFadeStyle {
  FadeOut = 0,
  CrossFade = 1,
}

type TransitionPointType = 'time' | 'frame';

enum ETransitionPointType {
  Time = 0,
  Frame = 1,
}

interface StingerTransitionOptions {
  /** Transition type **/
  type: 'stinger';
  /** The name of the transition **/
  name: string;
  /** A relative URL to a video asset inside a Platform app **/
  url: string;
  /** How the audio should fade: fade out or crossfade. **/
  audioFadeStyle?: AudioFadeStyle;
  /**
   * If set to true scene, the scene transition won't be editable by
   * end-users after being created.
   */
  shouldLock?: boolean;
  /** Whether to monitor audio **/
  shouldMonitorAudio?: boolean;
  /** A transition point in milliseconds **/
  transitionPoint?: number;
  /** Type of transition point, frame or time **/
  transitionPointType?: TransitionPointType;
}

// this makes it clear this is going to be a sum type
// prettier-ignore
type TransitionOptions =
  | StingerTransitionOptions;

const stingerTransitionDefaultOptions: Partial<StingerTransitionOptions> = {
  type: 'stinger',
  transitionPointType: 'time',
  shouldMonitorAudio: false,
  audioFadeStyle: 'fadeOut',
  shouldLock: false,
};

/**
 * This module can be used to manage scene transitions.
 * It's useful for apps to provide both editable and uneditable transitions for the streamer.
 */
export class SceneTransitionsModule extends Module {
  moduleName = 'SceneTransitions';

  permissions = [EApiPermissions.SceneTransitions];

  @Inject() transitionsService: TransitionsService;

  @Inject() platformAppsService: PlatformAppsService;

  /**
   * Create a scene transition
   *
   * Currently, only stinger transitions are supported, as these are the most
   * useful for customization.
   *
   * @param ctx API context
   * @param options A description of transition options
   *
   * @see {TransitionOptions}
   * @see {ITransition}
   */
  @apiMethod()
  async createTransition(ctx: IApiContext, options: TransitionOptions): Promise<ITransition> {
    if (options.type === 'stinger') {
      const appId = ctx.app.id;
      const { url } = options;

      if (!this.isVideo(url)) {
        throw new Error('Invalid file specified, you must provide a video file.');
      }

      const { shouldLock = false, name, ...settings } = options;

      const transitionOptions = this.createTransitionOptions(appId, shouldLock, {
        ...stingerTransitionDefaultOptions,
        ...settings,
      } as TransitionOptions);

      return this.transitionsService.createTransition(
        ETransitionType.Stinger,
        name,
        transitionOptions,
      );
    }

    throw new Error('Not Implemented');
  }

  /**
   * Get a list of transitions
   *
   * This includes all transitions the user has setup in SLOBS.
   * For transitions managed by this App use `getAppTransitions`.
   *
   * @see {getAppTransitions}
   */
  @apiMethod()
  async getTransitions(_ctx: IApiContext): Promise<Array<ITransition>> {
    return this.transitionsService.state.transitions;
  }

  /**
   * Get a list of transitions belonging to this App.
   *
   * @param ctx API context
   * @return A list of Transition objects belonging to the current App
   */
  @apiMethod()
  async getAppTransitions(ctx: IApiContext): Promise<Array<ITransition>> {
    return Object.keys(this.transitionsService.obsTransitions)
      .filter(obsTransitionId => {
        const settings = this.transitionsService.getPropertiesManagerSettings(obsTransitionId);

        return settings && settings.appId === ctx.app.id;
      })
      .map(id => this.transitionsService.getTransition(id));
  }

  /**
   * Set a transition as the default transition
   *
   * @param transitionId ID of the transition to be set as default
   * @return Whether setting the default succeeded
   */
  @apiMethod()
  async setDefaultTransition(_ctx: IApiContext, transitionId: string): Promise<boolean> {
    return tryCatchToBool(() => this.transitionsService.setDefaultTransition(transitionId));
  }

  /**
   * Delete a transition
   *
   * Deletes a specific transition by ID.
   *
   * @param _ctx API Context
   * @param transitionId ID of the transition to be deleted
   * @return Whether the transition was successfully deleted
   */
  @apiMethod()
  async deleteTransition(_ctx: IApiContext, transitionId: string): Promise<boolean> {
    return tryCatchToBool(() => this.transitionsService.deleteTransition(transitionId));
  }

  /**
   * Create a scene transition connection between scenes
   *
   * @param _ctx API Context
   * @param transitionId ID of the transition to connect
   * @param fromSceneId Originating scene ID
   * @param toSceneId Target scene ID
   * @see {ScenesModule.getScenes} for information on how to retrieve scene IDs
   */
  @apiMethod()
  async createConnection(
    _ctx: IApiContext,
    transitionId: string,
    fromSceneId: string,
    toSceneId: string,
  ) {
    return this.transitionsService.addConnection(fromSceneId, toSceneId, transitionId);
  }

  private createTransitionOptions(
    appId: string,
    shouldLock: boolean,
    options: TransitionOptions,
  ): ITransitionCreateOptions {
    const obsKeyMapping = {
      audioFadeStyle: 'audio_fade_style',
      transitionPointType: 'tp_type',
      shouldMonitorAudio: 'audio_monitoring',
      transitionPoint: 'transition_point',
      url: 'path',
    };

    const obsValueMapping = {
      type: (type: string): ETransitionType => {
        if (type === 'stinger') {
          return ETransitionType.Stinger;
        }
      },
      audioFadeStyle: (x: AudioFadeStyle): ObsAudioFadeStyle =>
        x === 'fadeOut' ? ObsAudioFadeStyle.FadeOut : ObsAudioFadeStyle.CrossFade,
      shouldMonitorAudio: (shouldMonitor: boolean) => (shouldMonitor ? 1 : 0),
      transitionPointType: (transitionPoint: TransitionPointType): ETransitionPointType =>
        transitionPoint === 'time' ? ETransitionPointType.Time : ETransitionPointType.Frame,
    };

    const settings = {};

    Object.keys(options).forEach(key => {
      const val = options[key];

      if (obsKeyMapping[key]) {
        settings[obsKeyMapping[key]] = obsValueMapping[key] ? obsValueMapping[key](val) : val;
      }
    });

    return {
      propertiesManagerSettings: {
        appId,
        locked: shouldLock,
      },
      settings: {
        ...settings,
        path: this.platformAppsService.getAssetUrl(appId, options.url),
      },
    };
  }

  private isVideo(url: string): boolean {
    const mimeType = getType(path.basename(url));
    return /^video\/.*$/.test(mimeType);
  }
}

/*
 * We return a boolean as this might fail if provided data is
 * invalid. Services don't typically have this concern and thus will
 * assume it'll always work. The best we can do is exception handling at
 * this point.
 */
const tryCatchToBool = (fn: () => void) => {
  try {
    fn();
    return true;
  } catch {
    return false;
  }
};
