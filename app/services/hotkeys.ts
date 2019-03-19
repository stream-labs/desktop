import { StreamingService } from 'services/streaming';
import { ScenesService } from 'services/scenes';
import { SourcesService } from 'services/sources';
import { TransitionsService } from 'services/transitions';
import { KeyListenerService } from 'services/key-listener';
import { Inject } from 'util/injector';
import { StatefulService, mutation, ServiceHelper } from 'services/stateful-service';
import { defer } from 'lodash';
import { $t } from 'services/i18n';
import * as obs from '../../obs-api';

function getScenesService(): ScenesService {
  return ScenesService.instance;
}

function getSourcesService(): SourcesService {
  return SourcesService.instance;
}

function getStreamingService(): StreamingService {
  return StreamingService.instance;
}

function getTransitionsService(): TransitionsService {
  return TransitionsService.instance;
}

const isAudio = (sourceId: string) => {
  const source = getSourcesService().getSource(sourceId);

  return source ? source.audio : false;
};

const isGameCapture = (sourceId: string) => {
  const source = getSourcesService().getSource(sourceId);

  return source ? source.type === 'game_capture' : false;
};

/**
 * Process a hotkey by sending it directly to OBS backend
 *
 * @param isKeyDown Whether the key was pressed or released
 */
const processObsHotkey = (isKeyDown: boolean) => (itemId: string, hotkeyId: number): void => {
  obs.NodeObs.OBS_API_ProcessHotkeyStatus(hotkeyId, isKeyDown);
};

type THotkeyType = 'GENERAL' | 'SCENE' | 'SCENE_ITEM' | 'SOURCE';

/**
 * Represents the key bound to a hotkey action
 */
export interface IBinding {
  key: string; // Is key code
  modifiers: {
    alt: boolean;
    ctrl: boolean;
    shift: boolean;
    meta: boolean;
  };
}

interface IHotkeyAction {
  name: string;
  description(entityId: string): string;

  down(entityId: string, hotkeyId?: number): void;

  isActive?(entityId: string): boolean;
  shouldApply?(entityId: string): boolean;

  up?(entityId: string, hotkeyId?: number): void;

  // These are injected dynamically
  downHandler?(): void;
  upHandler?(): void;
}

type HotkeyGroup = {
  [actionName: string]: IHotkeyAction;
};

const GENERAL_ACTIONS: HotkeyGroup = {
  TOGGLE_START_STREAMING: {
    name: 'TOGGLE_START_STREAMING',
    description: () => $t('Start Streaming'),
    down: () => getStreamingService().toggleStreaming(),
    isActive: () => {
      const streamingService = getStreamingService();
      return streamingService.isStreaming;
    },
  },
  TOGGLE_STOP_STREAMING: {
    name: 'TOGGLE_STOP_STREAMING',
    description: () => $t('Stop Streaming'),
    down: () => {
      const streamingService = getStreamingService();
      streamingService.toggleStreaming();
    },
    isActive: () => {
      const streamingService = getStreamingService();
      return !streamingService.isStreaming;
    },
  },
  TOGGLE_START_RECORDING: {
    name: 'TOGGLE_START_RECORDING',
    description: () => $t('Start Recording'),
    down: () => getStreamingService().toggleRecording(),
    isActive: () => getStreamingService().isRecording,
  },
  TOGGLE_STOP_RECORDING: {
    name: 'TOGGLE_STOP_RECORDING',
    description: () => $t('Stop Recording'),
    down: () => getStreamingService().toggleRecording(),
    isActive: () => !getStreamingService().isRecording,
  },
  ENABLE_STUDIO_MODE: {
    name: 'ENABLE_STUDIO_MODE',
    description: () => $t('Enable Studio Mode'),
    down: () => getTransitionsService().enableStudioMode(),
    isActive: () => getTransitionsService().state.studioMode,
  },
  DISABLE_STUDIO_MODE: {
    name: 'DISABLE_STUDIO_MODE',
    description: () => $t('Disable Studio Mode'),
    down: () => getTransitionsService().disableStudioMode(),
    isActive: () => !getTransitionsService().state.studioMode,
  },
  TRANSITION_STUDIO_MODE: {
    name: 'TRANSITION_STUDIO_MODE',
    description: () => $t('Transition (Studio Mode)'),
    down: () => getTransitionsService().executeStudioModeTransition(),
  },
  SAVE_REPLAY: {
    name: 'SAVE_REPLAY',
    description: () => $t('Save Replay'),
    down: () => getStreamingService().saveReplay(),
  },
};

const SOURCE_ACTIONS: HotkeyGroup = {
  TOGGLE_MUTE: {
    name: 'TOGGLE_MUTE',
    description: () => $t('Mute'),
    down: sourceId => getSourcesService().setMuted(sourceId, true),
    isActive: sourceId => getSourcesService().getSource(sourceId).muted,
    shouldApply: isAudio,
  },
  TOGGLE_UNMUTE: {
    name: 'TOGGLE_UNMUTE',
    description: () => $t('Unmute'),
    down: sourceId => getSourcesService().setMuted(sourceId, false),
    isActive: sourceId => !getSourcesService().getSource(sourceId).muted,
    shouldApply: isAudio,
  },
  PUSH_TO_MUTE: {
    name: 'PUSH_TO_MUTE',
    description: () => $t('Push to Mute'),
    down: sourceId => getSourcesService().setMuted(sourceId, true),
    up: sourceId => getSourcesService().setMuted(sourceId, false),
    shouldApply: isAudio,
  },
  PUSH_TO_TALK: {
    name: 'PUSH_TO_TALK',
    description: () => $t('Push to Talk'),
    down: sourceId => getSourcesService().setMuted(sourceId, false),
    up: sourceId => getSourcesService().setMuted(sourceId, true),
    shouldApply: isAudio,
  },
  GAME_CAPTURE_HOTKEY_START: {
    name: 'GAME_CAPTURE_HOTKEY_START',
    description: () => $t('Capture Foreground Window'),
    up: processObsHotkey(false),
    down: processObsHotkey(true),
    shouldApply: isGameCapture,
  },
  GAME_CAPTURE_HOTKEY_STOP: {
    name: 'GAME_CAPTURE_HOTKEY_STOP',
    description: () => $t('Deactivate Capture'),
    up: processObsHotkey(false),
    down: processObsHotkey(true),
    shouldApply: isGameCapture,
  },
};

const SCENE_ACTIONS: HotkeyGroup = {
  SWITCH_TO_SCENE: {
    name: 'SWITCH_TO_SCENE',
    description: () => $t('Switch to scene'),
    down: sceneId => getScenesService().makeSceneActive(sceneId),
  },
};

const SCENE_ITEM_ACTIONS: HotkeyGroup = {
  TOGGLE_SOURCE_VISIBILITY_SHOW: {
    name: 'TOGGLE_SOURCE_VISIBILITY_SHOW',
    description: sceneItemId => {
      const sceneItem = getScenesService().getSceneItem(sceneItemId);
      return $t('Show %{sourcename}', { sourcename: sceneItem.source.name });
    },
    shouldApply: sceneItemId => getScenesService().getSceneItem(sceneItemId).video,
    isActive: sceneItemId => getScenesService().getSceneItem(sceneItemId).visible,
    down: sceneItemId =>
      getScenesService()
        .getSceneItem(sceneItemId)
        .setVisibility(true),
  },
  TOGGLE_SOURCE_VISIBILITY_HIDE: {
    name: 'TOGGLE_SOURCE_VISIBILITY_HIDE',
    description: sceneItemId => {
      const sceneItem = getScenesService().getSceneItem(sceneItemId);
      return $t('Hide %{sourcename}', { sourcename: sceneItem.source.name });
    },
    shouldApply: sceneItemId => getScenesService().getSceneItem(sceneItemId).video,
    isActive: sceneItemId => !getScenesService().getSceneItem(sceneItemId).visible,
    down: sceneItemId =>
      getScenesService()
        .getSceneItem(sceneItemId)
        .setVisibility(false),
  },
};

/**
 * All possible hotkeys should be defined in this object.
 * All information about the hotkey and its behavior is
 * encapsulated within the action definition here.
 *
 * WARNING: Changing the name of existing hotkey actions
 * will cause people to lose their saved keybindings. The
 * name shouldn't really change after it is added.
 */
const ACTIONS: HotkeyGroup = {
  ...GENERAL_ACTIONS,
  ...SOURCE_ACTIONS,
  ...SCENE_ACTIONS,
  ...SCENE_ITEM_ACTIONS,
};

/**
 * Represents a serialized Hotkey
 */
export interface IHotkey {
  actionName: string;
  bindings: IBinding[];
  description?: string;
  resourceId?: string;
  sceneId?: string;
  sourceId?: string;
  sceneItemId?: string;
  hotkeyId?: number;
}

/**
 * Represents the full set of bindable hotkeys
 * for convenient render inside a component
 */
export interface IHotkeysSet {
  general: IHotkey[];
  sources: Dictionary<IHotkey[]>;
  scenes: Dictionary<IHotkey[]>;
}

interface IHotkeysServiceState {
  hotkeys: IHotkey[]; // only bound hotkeys are stored
}

type OBSHotkey = {
  ObjectName: string;
  ObjectType: obs.EHotkeyObjectType;
  HotkeyName: string;
  HotkeyDesc: string;
  HotkeyId: number;
};

export class HotkeysService extends StatefulService<IHotkeysServiceState> {
  static initialState: IHotkeysServiceState = {
    hotkeys: [],
  };

  @Inject()
  private scenesService: ScenesService;

  @Inject()
  private sourcesService: SourcesService;

  @Inject()
  private keyListenerService: KeyListenerService;

  /**
   * Memoizes the currently registered hotkeys
   */
  private registeredHotkeys: Hotkey[];

  init() {
    this.scenesService.sceneAdded.subscribe(() => this.invalidate());
    this.scenesService.sceneRemoved.subscribe(() => this.invalidate());
    this.scenesService.itemAdded.subscribe(() => this.invalidate());
    this.scenesService.itemRemoved.subscribe(() => this.invalidate());
    this.sourcesService.sourceAdded.subscribe(() => this.invalidate());
    this.sourcesService.sourceRemoved.subscribe(() => this.invalidate());
  }

  addHotkey(hotkeyModel: IHotkey) {
    this.ADD_HOTKEY(hotkeyModel);
  }

  private invalidate() {
    this.registeredHotkeys = null;
  }

  private updateRegisteredHotkeys() {
    const hotkeys: IHotkey[] = [];
    /*
     * Since we're hybrid at this point, track already-added hotkeys so OBS
     * hotkeys don't duplicate them
     */
    const addedHotkeys = new Set<string>();

    Object.values(GENERAL_ACTIONS).forEach(action => {
      hotkeys.push({
        actionName: action.name,
        bindings: [],
      });
      addedHotkeys.add(action.name);
    });

    this.scenesService.scenes.forEach(scene => {
      Object.values(SCENE_ACTIONS).forEach(action => {
        hotkeys.push({
          actionName: action.name,
          bindings: [],
          sceneId: scene.id,
        });
        addedHotkeys.add(`${action.name}-${scene.id}`);
      });

      scene.getItems().forEach(sceneItem => {
        Object.values(SCENE_ITEM_ACTIONS).forEach(action => {
          hotkeys.push({
            actionName: action.name,
            bindings: [],
            sceneItemId: sceneItem.sceneItemId,
          });
          addedHotkeys.add(`${action.name}-${sceneItem.sceneItemId}`);
        });
      });
    });

    const obsHotkeys: OBSHotkey[] = obs.NodeObs.OBS_API_QueryHotkeys();

    obsHotkeys
      .filter(hotkey => this.isSupportedHotkey(hotkey))
      .forEach(hotkey => {
        const action = this.getActionForHotkey(hotkey);

        if (action && action.name) {
          const key = `${action.name}-${hotkey.ObjectName}`;

          if (!addedHotkeys.has(key)) {
            hotkeys.push({
              sourceId: hotkey.ObjectName,
              actionName: action.name,
              bindings: [] as IBinding[],
              hotkeyId: hotkey.HotkeyId,
            });
            addedHotkeys.add(key);
          }
        }
      });

    // Set up bindings from saved hotkeys
    // This is a slow O(n^2) process, and may need to
    // be optimized later.
    this.state.hotkeys.forEach(savedHotkey => {
      const hotkey = hotkeys.find(blankHotkey => {
        return this.getHotkey(blankHotkey).equals(savedHotkey);
      });
      if (hotkey) hotkey.bindings = [].concat(savedHotkey.bindings);
    });

    this.registeredHotkeys = hotkeys.map(hotkeyModel => this.getHotkey(hotkeyModel));
  }

  getHotkey(obj: IHotkey): Hotkey {
    return new Hotkey(obj);
  }

  getHotkeys(): Hotkey[] {
    if (!this.registeredHotkeys) this.updateRegisteredHotkeys();
    return this.registeredHotkeys.filter(hotkey => hotkey.shouldApply);
  }

  getHotkeysSet(): IHotkeysSet {
    const sourcesHotkeys: Dictionary<Hotkey[]> = {};
    this.sourcesService.getSources().forEach(source => {
      const sourceHotkeys = this.getSourceHotkeys(source.sourceId);
      if (sourceHotkeys.length) sourcesHotkeys[source.sourceId] = sourceHotkeys;
    });

    const scenesHotkeys: Dictionary<Hotkey[]> = {};
    this.scenesService.scenes.forEach(scene => {
      const sceneItemsHotkeys = this.getSceneItemsHotkeys(scene.id);
      const sceneHotkeys = sceneItemsHotkeys.concat(this.getSceneHotkeys(scene.id));
      if (sceneHotkeys.length) scenesHotkeys[scene.id] = sceneHotkeys;
    });

    return {
      general: this.getGeneralHotkeys(),
      sources: sourcesHotkeys,
      scenes: scenesHotkeys,
    };
  }

  clearAllHotkeys() {
    this.applyHotkeySet({
      general: [],
      sources: {},
      scenes: {},
    });
  }

  applyHotkeySet(hotkeySet: IHotkeysSet) {
    const hotkeys: IHotkey[] = [];
    hotkeys.push(...hotkeySet.general);
    Object.keys(hotkeySet.scenes).forEach(sceneId => hotkeys.push(...hotkeySet.scenes[sceneId]));
    Object.keys(hotkeySet.sources).forEach(sourceId =>
      hotkeys.push(...hotkeySet.sources[sourceId]),
    );
    this.setHotkeys(hotkeys);
    this.bindHotkeys();
  }

  getGeneralHotkeys(): Hotkey[] {
    return this.getHotkeys().filter(hotkey => hotkey.type === 'GENERAL');
  }

  getSourceHotkeys(sourceId: string): Hotkey[] {
    return this.getHotkeys().filter(hotkey => hotkey.sourceId === sourceId);
  }

  getSceneHotkeys(sceneId: string): Hotkey[] {
    return this.getHotkeys().filter(hotkey => hotkey.sceneId === sceneId);
  }

  getSceneItemsHotkeys(sceneId: string): Hotkey[] {
    const scene = this.scenesService.getScene(sceneId);
    const sceneItemsIds = scene.nodes.map(item => item.id);
    return this.getHotkeys().filter(hotkey => sceneItemsIds.includes(hotkey.sceneItemId));
  }

  getSceneItemHotkeys(sceneItemId: string): Hotkey[] {
    return this.getHotkeys().filter(hotkey => hotkey.sceneItemId === sceneItemId);
  }

  unregisterAll() {
    this.keyListenerService.unregisterAll();
  }

  private setHotkeys(hotkeys: IHotkey[]) {
    this.CLEAR_HOTKEYS();
    hotkeys.forEach(hotkey => {
      if (hotkey.bindings.length) this.ADD_HOTKEY(hotkey);
    });
    this.invalidate();
  }

  bindHotkeys() {
    this.unregisterAll();

    // Node-libuiohook does not support binding multiple callbacks to
    // a single key event, so we have to group them by binding

    const downBindingMap = new Map<string, Hotkey[]>();
    const upBindingMap = new Map<string, Hotkey[]>();

    this.getHotkeys().forEach(hotkey => {
      hotkey.bindings.forEach(binding => {
        const downHotkeys = downBindingMap.get(JSON.stringify(binding)) || [];
        const upHotkeys = upBindingMap.get(JSON.stringify(binding)) || [];

        if (hotkey.action.downHandler) downHotkeys.push(hotkey);
        if (hotkey.action.upHandler) upHotkeys.push(hotkey);

        downBindingMap.set(JSON.stringify(binding), downHotkeys);
        upBindingMap.set(JSON.stringify(binding), upHotkeys);
      });
    });

    downBindingMap.forEach((hotkeys, bindingStr) => {
      const binding = JSON.parse(bindingStr);

      this.keyListenerService.register({
        ...binding,
        eventType: 'registerKeydown',
        callback: () => hotkeys.forEach(hotkey => hotkey.action.downHandler()),
      });
    });

    upBindingMap.forEach((hotkeys, bindingStr) => {
      const binding = JSON.parse(bindingStr);

      this.keyListenerService.register({
        ...binding,
        eventType: 'registerKeyup',
        callback: () => hotkeys.forEach(hotkey => hotkey.action.upHandler()),
      });
    });
  }

  @mutation()
  private ADD_HOTKEY(hotkeyObj: IHotkey) {
    this.state.hotkeys.push(hotkeyObj);
  }

  @mutation()
  private SET_BINDINGS(hotkeyInd: number, bindings: IBinding[]) {
    this.state.hotkeys[hotkeyInd].bindings = bindings;
  }

  @mutation()
  private CLEAR_HOTKEYS() {
    this.state.hotkeys = [];
  }

  private isSupportedHotkey(hotkey: OBSHotkey) {
    if (hotkey.ObjectType !== obs.EHotkeyObjectType.Source) {
      return false;
    }

    const action = this.getActionForHotkey(hotkey);

    return action && action.name && idPropFor(hotkey);
  }

  private getActionForHotkey(hotkey: OBSHotkey): IHotkeyAction {
    const action = getActionFromName(hotkey.HotkeyName);

    // Return the action immediately if there's a 1-1 mapping
    if (action && action.name) {
      return action;
    }

    // Otherwise prefix the hotkey name with its source type
    const source = this.sourcesService.getSource(hotkey.ObjectName);

    if (source) {
      return ACTIONS[`${source.type.toUpperCase()}_${hotkey.HotkeyName}`];
    }
  }
}

/**
 * Represents a single bindable hotkey
 */
@ServiceHelper()
export class Hotkey implements IHotkey {
  actionName: string;
  sceneId?: string;
  sourceId?: string;
  sceneItemId?: string;
  bindings: IBinding[];

  type: THotkeyType;
  description: string;
  action: IHotkeyAction;
  shouldApply: boolean;

  @Inject() private hotkeysService: HotkeysService;

  private readonly hotkeyModel: IHotkey;

  constructor(hotkeyModel: IHotkey) {
    Object.assign(this, hotkeyModel);
    this.hotkeyModel = hotkeyModel;

    if (this.sourceId) {
      this.type = 'SOURCE';
    } else if (this.sceneItemId) {
      this.type = 'SCENE_ITEM';
    } else if (this.sceneId) {
      this.type = 'SCENE';
    } else {
      this.type = 'GENERAL';
    }

    const entityId = this.sourceId || this.sceneId || this.sceneItemId;

    this.action = this.getAction(entityId);
    this.description = this.action.description(entityId);
    this.shouldApply = this.action.shouldApply(entityId);
  }

  equals(other: IHotkey) {
    return (
      this.actionName === other.actionName &&
      this.sceneId === other.sceneId &&
      this.sourceId === other.sourceId &&
      this.sceneItemId === other.sceneItemId
    );
  }

  getModel(): IHotkey {
    return { ...this.hotkeyModel };
  }

  private getAction(entityId: string): IHotkeyAction {
    const action = getActionFromName(this.actionName);

    const { up, down } = action;

    // Fill in optional functions with some defaults
    if (!action.isActive) action.isActive = () => false;
    if (!action.shouldApply) action.shouldApply = () => true;

    // We defer the actions until after we've decided whether
    // or not to execute each action.
    if (up) {
      action.upHandler = () => {
        if (!action.isActive(entityId)) {
          defer(() => up(entityId, this.hotkeyModel.hotkeyId));
        }
      };
    }

    if (down) {
      action.downHandler = () => {
        if (!action.isActive(entityId)) {
          defer(() => down(entityId, this.hotkeyModel.hotkeyId));
        }
      };
    }

    return action;
  }
}

const getMigrationMapping = (actionName: string) => {
  return {
    MUTE: 'TOGGLE_MUTE',
    UNMUTE: 'TOGGLE_UNMUTE',
  }[normalizeActionName(actionName)];
};

const getActionFromName = (actionName: string) => ({
  ...(ACTIONS[actionName] || ACTIONS[getMigrationMapping(actionName)]),
});

const isSceneItem = (hotkey: OBSHotkey) => !!getScenesService().getSceneItem(hotkey.ObjectName);

const isSource = (hotkey: OBSHotkey) => !!getSourcesService().getSource(hotkey.ObjectName);

const isScene = (hotkey: OBSHotkey) => !!getScenesService().getScene(hotkey.ObjectName);

const idPropFor = (hotkey: OBSHotkey) => {
  if (isSource(hotkey)) {
    return 'sourceId';
    // tslint:disable-next-line:no-else-after-return false positive
  } else if (isScene(hotkey)) {
    return 'sceneId';
  } else if (isSceneItem(hotkey)) {
    return 'sceneItemId';
  } else {
    return null;
  }
};

const normalizeActionName = (actionName: string) => actionName.split('.')[0];
