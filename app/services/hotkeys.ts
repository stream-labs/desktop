import StreamingService from './streaming';
import { ScenesService } from './scenes';
import { SourcesService } from './sources';
import { KeyListenerService } from './key-listener';
import { Inject } from '../util/injector';
import { StatefulService, mutation, ServiceHelper } from './stateful-service';

enum HotkeyActionKind {
  Simple,
  Toggle
}

function getScenesService(): ScenesService {
  return ScenesService.instance;
}

function getSourcesService(): SourcesService {
  return SourcesService.instance;
}

function getStreamingService(): StreamingService {
  return StreamingService.instance;
}

type THotkeyType = 'GENERAL' | 'SCENE' | 'SCENE_ITEM' | 'SOURCE';

interface IHotkeyAction {
  name: string;
  toggle?: string;
  description(entityId: string): string;
  down(entityId: string): void;
  isActive?(entityId: string): boolean;
  shouldApply?(entityId: string): boolean;
  up?(entityId: string): void;

  // These are injected dynamically
  downHandler?(accelerator: string, processedHotkeys: Hotkey[]): boolean;
  upHandler?(accelerator: string, processedHotkeys: Hotkey[]): boolean;
}


// All possible hotkeys should be defined in this object.
// All information about the hotkey and its behavior is
// encapsulated within the action definition here.
//
// WARNING: Changing the name of existing hotkey actions
// will cause people to lose their saved keybindings. The
// name shouldn't really change after it is added.

const HOTKEY_ACTIONS: Dictionary<IHotkeyAction[]> = {
  GENERAL: [
    {
      name: 'TOGGLE_START_STREAMING',
      toggle: 'TOGGLE_STOP_STREAMING',
      description: () => 'Start Streaming',
      down: () => getStreamingService().startStreaming(),
      isActive: () => getStreamingService().isRecording
    },
    {
      name: 'TOGGLE_STOP_STREAMING',
      toggle: 'TOGGLE_START_STREAMING',
      description: () => 'Stop Streaming',
      down: () => getStreamingService().startStreaming(),
      isActive: () => !getStreamingService().isStreaming
    },
    {
      name: 'TOGGLE_START_RECORDING',
      toggle: 'TOGGLE_STOP_RECORDING',
      description: () => 'Start Recording',
      down: () => getStreamingService().startRecording(),
      isActive: () => getStreamingService().isRecording
    },
    {
      name: 'TOGGLE_STOP_RECORDING',
      toggle: 'TOGGLE_START_RECORDING',
      description: () => 'Stop Recording',
      down: () => getStreamingService().stopRecording(),
      isActive: () => !getStreamingService().isRecording
    }
  ],

  SCENE: [
    {
      name: 'SWITCH_TO_SCENE',
      description: () => 'Switch to scene',
      down: (sceneId) => getScenesService().makeSceneActive(sceneId)
    }
  ],

  SCENE_ITEM: [
    {
      name: 'TOGGLE_SOURCE_VISIBILITY_SHOW',
      toggle: 'TOGGLE_SOURCE_VISIBILITY_HIDE',
      description: (sceneItemId) => {
        const sceneItem = getScenesService().getSceneItem(sceneItemId);
        return `Show '${sceneItem.source.displayName}'`;
      },
      shouldApply: (sceneItemId) => getScenesService().getSceneItem(sceneItemId).video,
      isActive: (sceneItemId) => getScenesService().getSceneItem(sceneItemId).visible,
      down: (sceneItemId) => getScenesService().getSceneItem(sceneItemId).setVisibility(true)
    },

    {
      name: 'TOGGLE_SOURCE_VISIBILITY_HIDE',
      toggle: 'TOGGLE_SOURCE_VISIBILITY_SHOW',
      description: (sceneItemId) => {
        const sceneItem = getScenesService().getSceneItem(sceneItemId);
        return `Hide '${sceneItem.source.displayName}'`;
      },
      shouldApply: (sceneItemId) => getScenesService().getSceneItem(sceneItemId).video,
      isActive: (sceneItemId) => !getScenesService().getSceneItem(sceneItemId).visible,
      down: (sceneItemId) => getScenesService().getSceneItem(sceneItemId).setVisibility(false)
    }
  ],

  SOURCE: [
    {
      name: 'TOGGLE_MUTE',
      toggle: 'TOGGLE_UNMUTE',
      description: () => 'Mute',
      down: (sourceId) => getSourcesService().setMuted(sourceId, true),
      isActive: (sourceId) => getSourcesService().getSource(sourceId).muted,
      shouldApply: (sourceId) => getSourcesService().getSource(sourceId).audio
    },
    {
      name: 'TOGGLE_UNMUTE',
      toggle: 'TOGGLE_MUTE',
      description: () => 'Unmute',
      down: (sourceId) => getSourcesService().setMuted(sourceId, false),
      isActive: (sourceId) => !getSourcesService().getSource(sourceId).muted,
      shouldApply: (sourceId) => getSourcesService().getSource(sourceId).audio
    },
    {
      name: 'PUSH_TO_MUTE',
      description: () => 'Push to Mute',
      down: (sourceId) => getSourcesService().setMuted(sourceId, true),
      up: (sourceId) => getSourcesService().setMuted(sourceId, false),
      shouldApply: (sourceId) => getSourcesService().getSource(sourceId).audio
    },
    {
      name: 'PUSH_TO_TALK',
      description: () => 'Push to Talk',
      down: (sourceId) => getSourcesService().setMuted(sourceId, false),
      up: (sourceId) => getSourcesService().setMuted(sourceId, true),
      shouldApply: (sourceId) => getSourcesService().getSource(sourceId).audio
    }
  ]
};

/**
 * Represents a serialized Hotkey
 */
export interface IHotkey {
  actionName: string;
  accelerators: string[];
  sceneId?: string;
  sourceId?: string;
  sceneItemId?: string;
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
  hotkeys: IHotkey[]; // only hotkeys with binded accelerators here
}


export class HotkeysService extends StatefulService<IHotkeysServiceState> {

  static initialState: IHotkeysServiceState = {
    hotkeys: []
  };

  @Inject()
  private scenesService: ScenesService;

  @Inject()
  private sourcesService: SourcesService;


  @Inject()
  private keyListenerService: KeyListenerService;

  private registeredHotkeys: Hotkey[];


  addHotkey(hotkeyModel: IHotkey) {
    this.ADD_HOTKEY(hotkeyModel);
  }

  private updateRegisteredHotkeys() {
    const hotkeys: IHotkey[] = [];

    HOTKEY_ACTIONS.GENERAL.forEach(action => {
      hotkeys.push({
        actionName: action.name,
        accelerators: []
      });
    });


    this.scenesService.scenes.forEach(scene => {
      scene.getItems().forEach(sceneItem => {
        HOTKEY_ACTIONS.SCENE_ITEM.forEach(action => {
          hotkeys.push({
            actionName: action.name,
            accelerators: [],
            sceneItemId: sceneItem.sceneItemId
          });
        });
      });

      HOTKEY_ACTIONS.SCENE.forEach(action => {
        hotkeys.push({
          actionName: action.name,
          accelerators: [],
          sceneId: scene.id
        });
      });
    });


    this.sourcesService.getSources().forEach(source => {
      HOTKEY_ACTIONS.SOURCE.forEach(action => {
        hotkeys.push({
          actionName: action.name,
          accelerators: [],
          sourceId: source.sourceId
        });
      });
    });

    // setup accelerators from saved hotkeys
    // This is a slow O(n^2) process, and may need to
    // be optimized later.
    this.state.hotkeys.forEach(savedHotkey => {
      const hotkey = hotkeys.find(blankHotkey => {
        return this.getHotkey(blankHotkey).isSameHotkey(savedHotkey);
      });
      if (hotkey) hotkey.accelerators = [].concat(savedHotkey.accelerators);
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
    this.updateRegisteredHotkeys();

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
      scenes: scenesHotkeys
    };
  }


  applyHotkeySet(hotkeySet: IHotkeysSet) {
    const hotkeys: IHotkey[] = [];
    hotkeys.push(...hotkeySet.general);
    Object.keys(hotkeySet.scenes).forEach(sceneId => hotkeys.push(...hotkeySet.scenes[sceneId]));
    Object.keys(hotkeySet.sources).forEach(sourceId => hotkeys.push(...hotkeySet.sources[sourceId]));
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
    const sceneItemsIds = scene.items.map(item => item.sceneItemId);
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
      if (hotkey.accelerators.length) this.ADD_HOTKEY(hotkey);
    });
    this.updateRegisteredHotkeys();
  }


  bindHotkeys() {
    this.unregisterAll();

    const downAcceleratorMap = new Map<string, Hotkey[]>();
    const upAcceleratorMap = new Map<string, Hotkey[]>();

    // We need to group all hotkeys by accelerator, since electron
    // does not support binding multiple callbacks to the same
    // accelerator.
    this.getHotkeys().forEach(hotkey => {
      if (hotkey.isBound()) {
        hotkey.accelerators.forEach(accelerator => {
          const downHotkeys = downAcceleratorMap.get(accelerator) || [];
          const upHotkeys = upAcceleratorMap.get(accelerator) || [];

          if (hotkey.action.downHandler) downHotkeys.push(hotkey);
          if (hotkey.action.upHandler) upHotkeys.push(hotkey);

          downAcceleratorMap.set(accelerator, downHotkeys);
          upAcceleratorMap.set(accelerator, upHotkeys);
        });
      }
    });

    downAcceleratorMap.forEach((hotkeys, accelerator) => {
      this.keyListenerService.register(
        accelerator,
        () => {
          const processedHotkeys: Hotkey[] = [];
          hotkeys.forEach(hotkey => {
            if (hotkey.action.downHandler(accelerator, processedHotkeys)) processedHotkeys.push(hotkey);
          });
        },
        'registerKeydown'
      );
    });

    upAcceleratorMap.forEach((hotkeys, accelerator) => {
      this.keyListenerService.register(
        accelerator,
        () => {
          const processedHotkeys: Hotkey[] = [];
          hotkeys.forEach(hotkey => {
            if (hotkey.action.upHandler(accelerator, processedHotkeys)) processedHotkeys.push(hotkey);
          });
        },
        'registerKeyup'
      );
    });
  }


  @mutation()
  private ADD_HOTKEY(hotkeyObj: IHotkey) {
    this.state.hotkeys.push(hotkeyObj);
  }


  @mutation()
  private SET_ACCELERATORS(hotkeyInd: number, accelerators: string[]) {
    this.state.hotkeys[hotkeyInd].accelerators = accelerators;
  }


  @mutation()
  private CLEAR_HOTKEYS() {
    this.state.hotkeys = [];
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
  accelerators: string[];

  toggle = '';
  type: THotkeyType;
  description: string;
  action: IHotkeyAction;
  shouldApply: boolean;

  @Inject() private hotkeysService: HotkeysService;

  private hotkeyModel: IHotkey;


  constructor(hotkeyModel: IHotkey) {
    Object.assign(this, hotkeyModel);
    this.hotkeyModel = hotkeyModel;

    if (this.sourceId) {
      this.type = 'SOURCE';
    } else if (this.sceneItemId) {
      this.type = 'SCENE_ITEM';
    } else if (this.sceneId) {
      this.type = 'SCENE';
    } else  {
      this.type = 'GENERAL';
    }

    const entityId = this.sourceId || this.sceneId || this.sceneItemId;

    this.action = this.getAction(entityId);
    this.description = this.action.description(entityId);
    this.shouldApply = this.action.shouldApply(entityId);
    this.toggle = this.action.toggle;
  }


  isSameHotkey(other: IHotkey) {
    return (this.actionName === other.actionName) &&
      (this.sceneId === other.sceneId) &&
      (this.sourceId === other.sourceId) &&
      (this.sceneItemId === other.sceneItemId);
  }


  getModel(): IHotkey {
    return { ...this.hotkeyModel };
  }


  isBound() {
    return this.accelerators.length > 0;
  }


  private getAction(entityId: string): IHotkeyAction {
    const action = { ...HOTKEY_ACTIONS[this.type].find(action => {
      return action.name === this.actionName;
    }) };

    const { up, down } = action;
    let actionKind: HotkeyActionKind;

    if (action.toggle) {
      actionKind = HotkeyActionKind.Toggle;
    } else {
      actionKind = HotkeyActionKind.Simple;
    }

    if (!action.isActive) action.isActive = () => false;
    if (!action.shouldApply) action.shouldApply = () => true;

    if (up) action.upHandler = (accelerator) => {
      if (!action.isActive(entityId)) {
        up(entityId);
        return true;
      }
      return false;
    };


    if (down) action.downHandler = (accelerator, processedHotkeys) => {

      // if kotkey kind is not toggle, process it as simple hotkey
      if (actionKind !== HotkeyActionKind.Toggle) {
        if (action.isActive(entityId)) return false;
        down(entityId);
        return true;
      }

      const oppositeHotkey = this.hotkeysService.getHotkeys().find(hotkey =>
       this.actionName === hotkey.toggle && hotkey.accelerators.includes(accelerator)
      );

      // if kotkey doesn't have opposite hotkey, process it as simple hotkey
      if (!oppositeHotkey) {
        if (action.isActive(entityId)) return false;
        down(entityId);
        return true;
      }

      // if the opposite hotkey already processed do nothing
      const alreadyProcessed = processedHotkeys.find(processedHotkey => processedHotkey.isSameHotkey(oppositeHotkey));
      if (alreadyProcessed) return false;

      // if the opposite hotkey is not processed, run action
      if (action.isActive(entityId)) return false;
      down(entityId);
      return true;
    };

    return action;
  }
}
