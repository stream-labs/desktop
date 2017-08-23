import { flatten } from 'lodash';

import { Service } from './service';
import StreamingService from './streaming';
import { ScenesService } from './scenes';
import { SourcesService, ISource } from './sources';
import electron from '../vendor/electron';
import { KeyListenerService } from './key-listener';
import { Inject } from '../util/injector';
import path from 'path';
import fs from 'fs';

const { app } = electron.remote;

enum HotkeyActionKind {
  Simple,
  Toggle,
  Momentary
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


interface IHotkeyBaseAction {
  // Only valid for hotkey actions on a scene.
  // If true, applies to each source in a scene.
  perSource?: boolean;

  // Only valid for hotkey actions a source.
  // Takes a source a determines whether it
  // is a valid action for the passed source.
  shouldApply?: (entityId: string) => boolean;

  kind: HotkeyActionKind;
}

interface IHotkeySimpleAction extends IHotkeyBaseAction {
  kind: HotkeyActionKind.Simple;
  description(entityId: string): string;
  handler(entityId: string): void;
}

interface IHotkeyToggleAction extends IHotkeyBaseAction {
  kind: HotkeyActionKind.Toggle;
  description: {
    on(entityId: string): string;
    off(entityId: string): string;
  };
  getCurrentState(entityId: string): boolean;
  on(entityId: string): void;
  off(entityId: string): void;
}

// TODO: These need to be implemented
interface IHotkeyMomentaryAction extends IHotkeyBaseAction {
  kind: HotkeyActionKind.Momentary;
  description(entityId: string): string;
  down(entityId: string): void;
  up(entityId: string): void;
}

type THotkeyAction =
  IHotkeySimpleAction |
  IHotkeyToggleAction |
  IHotkeyMomentaryAction;


// All possible hotkeys should be defined in this object.
// All information about the hotkey and its behavior is
// encapsulated within the action definition here.
//
// WARNING: Changing the name of existing hotkey actions
// will cause people to lose their saved keybindings. The
// name shouldn't really change after it is added.
const HOTKEY_ACTIONS = {
  GENERAL: {
    TOGGLE_STREAMING: <IHotkeyToggleAction>{
      kind: HotkeyActionKind.Toggle,
      description: {
        on() {
          return 'Start Streaming';
        },
        off() {
          return 'Stop Streaming';
        }
      },
      getCurrentState() {
        return getStreamingService().isStreaming;
      },
      on() {
        getStreamingService().startStreaming();
      },
      off() {
        getStreamingService().stopStreaming();
      }
    },

    TOGGLE_RECORDING: <IHotkeyToggleAction>{
      kind: HotkeyActionKind.Toggle,
      description: {
        on() {
          return 'Start Recording';
        },
        off() {
          return 'Stop Recording';
        }
      },
      getCurrentState() {
        return getStreamingService().isRecording;
      },
      on() {
        getStreamingService().startRecording();
      },
      off() {
        getStreamingService().stopRecording();
      }
    }
  },

  SCENE: {
    TOGGLE_SOURCE_VISIBILITY: <IHotkeyToggleAction>{
      kind: HotkeyActionKind.Toggle,
      perSource: true,
      shouldApply(sceneItemId) {
        return getScenesService().getSceneItem(sceneItemId).video;
      },
      description: {
        on(sceneItemId) {
          const sceneItem = getScenesService().getSceneItem(sceneItemId);
          return `Show '${sceneItem.source.displayName}'`;
        },
        off(sceneItemId) {
          const sceneItem = getScenesService().getSceneItem(sceneItemId);
          return `Hide '${sceneItem.source.displayName}'`;
        }
      },

      getCurrentState(sceneItemId: string) {
        return getScenesService().getSceneItem(sceneItemId).visible;
      },

      on(sceneItemId: string) {
        getScenesService().getSceneItem(sceneItemId).setVisibility(true);
      },

      off(sceneItemId: string) {
        getScenesService().getSceneItem(sceneItemId).setVisibility(false);
      }
    },

    SWITCH_TO_SCENE: <IHotkeySimpleAction>{
      kind: HotkeyActionKind.Simple,
      description() {
        return 'Switch to scene';
      },
      handler(sceneId) {
        getScenesService().makeSceneActive(sceneId);
      }
    }
  },

  SOURCE: {
    TOGGLE_MUTE: <IHotkeyToggleAction>{
      kind: HotkeyActionKind.Toggle,
      description: {
        on() {
          return 'Mute';
        },
        off() {
          return 'Unmute';
        }
      },
      shouldApply(sourceId) {
        return getSourcesService().getSource(sourceId).audio;
      },
      getCurrentState(sourceId) {
        return getSourcesService().getSource(sourceId).muted;
      },
      on(sourceId) {
        getSourcesService().setMuted(sourceId, true);
      },
      off(sourceId) {
        getSourcesService().setMuted(sourceId, false);
      }
    },

    PUSH_TO_MUTE: <IHotkeyMomentaryAction>{
      kind: HotkeyActionKind.Momentary,
      description() {
        return 'Push to Mute';
      },
      shouldApply(sourceId) {
        return getSourcesService().getSource(sourceId).audio;
      },
      down(sourceId) {
        getSourcesService().setMuted(sourceId, true);
      },
      up(sourceId) {
        getSourcesService().setMuted(sourceId, false);
      }
    },

    PUSH_TO_TALK: <IHotkeyMomentaryAction>{
      kind: HotkeyActionKind.Momentary,
      description() {
        return 'Push to Talk';
      },
      shouldApply(sourceId) {
        return getSourcesService().getSource(sourceId).audio;
      },
      down(sourceId) {
        getSourcesService().setMuted(sourceId, false);
      },
      up(sourceId) {
        getSourcesService().setMuted(sourceId, true);
      }
    }
  }
};


// Represents a serialized Hotkey
export interface HotkeyObject {
  action: string;
  toggle: string;
  sceneId?: string;
  sourceId?: string;
  sceneItemId?: string;
  accelerators: string[];
}


// Represents a single bindable hotkey
export class Hotkey {

  action: string;
  toggle: string;
  sceneId?: string;
  sourceId?: string;
  sceneItemId?: string;
  accelerators: Set<string>;

  // These are injected dynamically
  downHandler: (accelerator: string) => void;
  upHandler: (accelerator: string) => void;
  description: string;

  static fromObject(obj: HotkeyObject) {
    const hotkey = new this();

    hotkey.action = obj.action;
    hotkey.toggle = obj.toggle;
    hotkey.sceneId = obj.sceneId;
    hotkey.sourceId = obj.sourceId;
    hotkey.sceneItemId = obj.sceneItemId;
    hotkey.accelerators = new Set(obj.accelerators || []);

    return hotkey;
  }

  toObject() {
    const obj = <HotkeyObject>{
      action: this.action,
      accelerators: Array.from(this.accelerators.values())
    };

    if (this.toggle) obj.toggle = this.toggle;
    if (this.sceneId) obj.sceneId = this.sceneId;
    if (this.sourceId) obj.sourceId = this.sourceId;
    if (this.sceneItemId) obj.sceneItemId = this.sceneItemId;

    return obj;
  }

  // Determines if they are the same hotkey
  isSameHotkey(other: Hotkey) {
    return (this.action === other.action) &&
      (this.toggle === other.toggle) &&
      (this.sceneId === other.sceneId) &&
      (this.sourceId === other.sourceId) &&
      (this.sceneItemId === other.sceneItemId);
  }

  isBound() {
    return this.accelerators.size > 0;
  }

}

// Represents the full set of bindable hotkeys.  Can
// be queried for various hotkey types.
export class HotkeySet {

  generalHotkeys: Hotkey[];
  sceneHotkeys: Map<string, Hotkey[]>;
  sourceHotkeys: Map<string, Hotkey[]>;

  constructor() {
    this.generalHotkeys = [];
    this.sceneHotkeys = new Map();
    this.sourceHotkeys = new Map();
  }

  addGeneralHotkeys(hotkeys: Hotkey[]) {
    this.generalHotkeys = this.generalHotkeys.concat(hotkeys);
  }

  addSceneHotkeys(scene: string, hotkeys: Hotkey[]) {
    const sceneHotkeys = this.sceneHotkeys.get(scene) || [];
    this.sceneHotkeys.set(scene, sceneHotkeys.concat(hotkeys));
  }

  addSourceHotkeys(source: string, hotkeys: Hotkey[]) {
    const sourceHotkeys = this.sourceHotkeys.get(source) || [];
    this.sourceHotkeys.set(source, sourceHotkeys.concat(hotkeys));
  }

  getGeneralHotkeys() {
    return this.generalHotkeys;
  }

  getSceneHotkeys(scene: string) {
    return this.sceneHotkeys.get(scene) || [];
  }

  getSourceHotkeys(source: string) {
    return this.sourceHotkeys.get(source) || [];
  }

  // Returns a single array of all hotkeys
  getAllHotkeys() {
    const hotkeys = [
      this.generalHotkeys,
      flatten(Array.from(this.sceneHotkeys.values())),
      flatten(Array.from(this.sourceHotkeys.values()))
    ];

    return flatten(hotkeys);
  }

}

export class HotkeysService extends Service {

  @Inject()
  scenesService: ScenesService;

  @Inject()
  sourcesService: SourcesService;

  @Inject()
  keyListenerService: KeyListenerService;

  // Loads the config from disk, and binds all current hotkeys
  bindAllHotkeys() {
    const set = this.getHotkeySet();
    this.bindHotkeySet(set);
  }

  unregisterAll() {
    this.keyListenerService.unregisterAll();
  }

  // Initializes all hotkeys from the action map, and
  // loads and reconciles all current bindings.
  getHotkeySet() {
    const hotkeySet = new HotkeySet();

    Object.keys(HOTKEY_ACTIONS.GENERAL).forEach(actionName => {
      const action = HOTKEY_ACTIONS.GENERAL[actionName] as THotkeyAction;
      hotkeySet.addGeneralHotkeys(this.hotkeysFromAction({ name: actionName, action }));
    });

    this.scenesService.scenes.forEach(scene => {
      Object.keys(HOTKEY_ACTIONS.SCENE).forEach(actionName => {
        const action = HOTKEY_ACTIONS.SCENE[actionName] as THotkeyAction;

        if (action.perSource) {
          scene.items.forEach(sceneItem => {
            const sceneItemId = sceneItem.sceneItemId;

            if (!action.shouldApply || action.shouldApply(sceneItemId)) {
              hotkeySet.addSceneHotkeys(
                scene.name,
                this.hotkeysFromAction({
                  name: actionName,
                  action,
                  sceneItemId
                })
              );
            }
          });
        } else {
          hotkeySet.addSceneHotkeys(
            scene.name,
            this.hotkeysFromAction({ name: actionName, action, sceneId: scene.id })
          );
        }
      });
    });

    this.sourcesService.sources.forEach((source: ISource) => {
      Object.keys(HOTKEY_ACTIONS.SOURCE).forEach(actionName => {
        const action = HOTKEY_ACTIONS.SOURCE[actionName] as THotkeyAction;
        const sourceId = source.sourceId;

        if (!action.shouldApply || action.shouldApply(sourceId)) {
          hotkeySet.addSourceHotkeys(
            source.name,
            this.hotkeysFromAction({
              name: actionName,
              action,
              sourceId
            })
          );
        }
      });
    });

    this.loadBindingsIntoHotkeys(hotkeySet.getAllHotkeys());

    return hotkeySet;
  }

  // Takes the given hotkey set, starts listening for
  // keypresses, and saves the configuration
  applyHotkeySet(hotkeySet: HotkeySet) {
    this.saveHotkeySet(hotkeySet);
    this.bindHotkeySet(hotkeySet);
  }

  // Saves the hotkey set to the configuration file
  saveHotkeySet(hotkeySet: HotkeySet) {
    const bindings: HotkeyObject[] = [];

    hotkeySet.getAllHotkeys().forEach(hotkey => {
      if (hotkey.isBound()) {
        bindings.push(hotkey.toObject());
      }
    });

    // TODO: Actually save this object
    fs.writeFileSync(this.bindingsFilePath, JSON.stringify({ bindings }));
  }

  bindHotkeySet(hotkeySet: HotkeySet) {
    this.unregisterAll();

    const downAcceleratorMap = new Map<string, Function[]>();
    const upAcceleratorMap = new Map<string, Function[]>();

    // We need to group all hotkeys by accelerator, since electron
    // does not support binding multiple callbacks to the same
    // accelerator.
    hotkeySet.getAllHotkeys().forEach(hotkey => {
      if (hotkey.isBound()) {
        hotkey.accelerators.forEach(accelerator => {
          const downHandlers = downAcceleratorMap.get(accelerator) || [];
          const upHandlers = upAcceleratorMap.get(accelerator) || [];

          if (hotkey.downHandler) downHandlers.push(hotkey.downHandler);
          if (hotkey.upHandler) upHandlers.push(hotkey.upHandler);

          downAcceleratorMap.set(accelerator, downHandlers);
          upAcceleratorMap.set(accelerator, upHandlers);
        });
      }
    });

    downAcceleratorMap.forEach((handlers, accelerator) => {
      this.keyListenerService.register(
        accelerator,
        () => {
          handlers.forEach(handler => {
            handler(accelerator);
          });
        },
        'registerKeydown'
      );
    });

    upAcceleratorMap.forEach((handlers, accelerator) => {
      this.keyListenerService.register(
        accelerator,
        () => {
          handlers.forEach(handler => {
            handler(accelerator);
          });
        },
        'registerKeyup'
      );
    });
  }

  // This is a slow O(n^2) process, and may need to
  // be optimized later.
  loadBindingsIntoHotkeys(hotkeys: Hotkey[]) {
    const bindings = this.loadBindings();

    hotkeys.forEach(hotkey => {
      bindings.forEach(binding => {
        if (hotkey.isSameHotkey(binding)) {
          hotkey.accelerators = binding.accelerators;
        }
      });
    });
  }

  loadBindings(): Hotkey[] {
    if (fs.existsSync(this.bindingsFilePath)) {
      const parsed: HotkeyObject[] = JSON.parse(fs.readFileSync(this.bindingsFilePath).toString()).bindings;

      return parsed.map(binding => {
        return Hotkey.fromObject(binding);
      });
    }

    return [];
  }

  hotkeysFromAction(
    options: { name: string, action: THotkeyAction, sceneId?: string, sourceId?: string, sceneItemId?: string }
  ) {
    const hotkeys: Hotkey[] = [];
    const { sceneId, sourceId, sceneItemId, action, name } = options;

    const hotkeyObj: HotkeyObject = {
      action: name,
      toggle: void 0,
      accelerators: [],
      sceneId,
      sourceId,
      sceneItemId
    };

    const entityId = sceneId || sourceId || sceneItemId;

    // Toggles result in 2 hotkeys per action
    if (action.kind === HotkeyActionKind.Toggle) {
      const onHotkey = Hotkey.fromObject(hotkeyObj);
      const offHotkey = Hotkey.fromObject(hotkeyObj);

      onHotkey.toggle = 'on';
      offHotkey.toggle = 'off';

      onHotkey.description = action.description.on(entityId);
      offHotkey.description = action.description.off(entityId);

      onHotkey.downHandler = accelerator => {
        // Act as a toggle
        if (offHotkey.accelerators.has(accelerator)) {
          if (action.getCurrentState(entityId)) {
            action.off(entityId);
          } else {
            action.on(entityId);
          }
        } else if (!action.getCurrentState(entityId)) {
          action.on(entityId);
        }
      };

      offHotkey.downHandler = accelerator => {
        if (onHotkey.accelerators.has(accelerator)) {
          // We do nothing.  The on hotkey is responsible
          // for handling toggles
        } else if (action.getCurrentState(entityId)) {
          action.off(entityId);
        }
      };

      hotkeys.push(onHotkey);
      hotkeys.push(offHotkey);
    } else if (action.kind === HotkeyActionKind.Simple) {
      const hotkey = Hotkey.fromObject(hotkeyObj);
      hotkey.description = action.description(entityId);

      hotkey.downHandler = () => {
        action.handler(entityId);
      };

      hotkeys.push(hotkey);
    } else if (action.kind === HotkeyActionKind.Momentary) {
      const hotkey = Hotkey.fromObject(hotkeyObj);
      hotkey.description = action.description(entityId);

      hotkey.downHandler = () => {
        action.down(entityId);
      };

      hotkey.upHandler = () => {
        action.up(entityId);
      };

      hotkeys.push(hotkey);
    }

    return hotkeys;
  }

  get bindingsFilePath() {
    return path.join(app.getPath('userData'), 'hotkeys.json');
  }

}
