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

interface IHotkeyBaseAction {
  // Only valid for hotkey actions on a scene.
  // If true, applies to each source in a scene.
  perSource?: boolean;

  // Only valid for hotkey actions a source.
  // Takes a source a determines whether it
  // is a valid action for the passed source.
  shouldApply?: (source: ISource) => boolean;

  kind: HotkeyActionKind;
}

interface IHotkeySimpleAction extends IHotkeyBaseAction {
  kind: HotkeyActionKind.Simple;
  description(sceneName: string, sourceName: string): string;
  handler(sceneName: string, sourceName: string): void;
}

interface IHotkeyToggleAction extends IHotkeyBaseAction {
  kind: HotkeyActionKind.Toggle;
  description: {
    on(sceneName: string, sourceName: string): string;
    off(sceneName: string, sourceName: string): string;
  };
  getCurrentState(sceneName: string, sourceName: string): boolean;
  on(sceneName: string, sourceName: string): void;
  off(sceneName: string, sourceName: string): void;
}

// TODO: These need to be implemented
interface IHotkeyMomentaryAction extends IHotkeyBaseAction {
  kind: HotkeyActionKind.Momentary;
  description(sceneName: string, sourceName: string): string;
  down(sceneName: string, sourceName: string): void;
  up(sceneName: string, sourceName: string): void;
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
        return StreamingService.instance.isStreaming;
      },
      on() {
        StreamingService.instance.startStreaming();
      },
      off() {
        StreamingService.instance.stopStreaming();
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
        return StreamingService.instance.isRecording;
      },
      on() {
        StreamingService.instance.startRecording();
      },
      off() {
        StreamingService.instance.stopRecording();
      }
    }
  },

  SCENE: {
    TOGGLE_SOURCE_VISIBILITY: <IHotkeyToggleAction>{
      kind: HotkeyActionKind.Toggle,
      perSource: true,
      shouldApply(source) {
        return source.video;
      },
      description: {
        on(scene, source) {
          return `Show '${source}'`;
        },
        off(scene, source) {
          return `Hide '${source}'`;
        }
      },
      getCurrentState(sceneName, sourceName) {
        const scene = ScenesService.instance.getSceneByName(sceneName);
        const source = SourcesService.instance.getSourceByName(sourceName);
        const mergedSource = ScenesService.instance.getItem(scene.id, source.id);

        return mergedSource.visible;
      },
      on(sceneName, sourceName) {
        const scene = ScenesService.instance.getSceneByName(sceneName);
        const source = SourcesService.instance.getSourceByName(sourceName);

        ScenesService.instance.getItem(scene.id, source.id).setVisibility(true);
      },
      off(sceneName, sourceName) {
        const scene = ScenesService.instance.getSceneByName(sceneName);
        const source = SourcesService.instance.getSourceByName(sourceName);

        ScenesService.instance.getItem(scene.id, source.id).setVisibility(false);
      }
    },

    SWITCH_TO_SCENE: <IHotkeySimpleAction>{
      kind: HotkeyActionKind.Simple,
      description() {
        return 'Switch to scene';
      },
      handler(scene) {
        const id = ScenesService.instance.getSceneByName(scene).id;
        ScenesService.instance.makeSceneActive(id);
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
      shouldApply(source) {
        return source.audio;
      },
      getCurrentState(sceneName, sourceName) {
        const source = SourcesService.instance.getSourceByName(sourceName);

        return source.muted;
      },
      on(sceneName, sourceName) {
        const source = SourcesService.instance.getSourceByName(sourceName);

        SourcesService.instance.setMuted(source.id, true);
      },
      off(sceneName, sourceName) {
        const source = SourcesService.instance.getSourceByName(sourceName);

        SourcesService.instance.setMuted(source.id, false);
      }
    },

    PUSH_TO_MUTE: <IHotkeyMomentaryAction>{
      kind: HotkeyActionKind.Momentary,
      description() {
        return 'Push to Mute';
      },
      shouldApply(source) {
        return source.audio;
      },
      down(sceneName, sourceName) {
        const source = SourcesService.instance.getSourceByName(sourceName);
        SourcesService.instance.setMuted(source.id, true);
      },
      up(sceneName, sourceName) {
        const source = SourcesService.instance.getSourceByName(sourceName);
        SourcesService.instance.setMuted(source.id, false);
      }
    },

    PUSH_TO_TALK: <IHotkeyMomentaryAction>{
      kind: HotkeyActionKind.Momentary,
      description() {
        return 'Push to Talk';
      },
      shouldApply(source) {
        return source.audio;
      },
      down(sceneName, sourceName) {
        const source = SourcesService.instance.getSourceByName(sourceName);
        SourcesService.instance.setMuted(source.id, false);
      },
      up(sceneName, sourceName) {
        const source = SourcesService.instance.getSourceByName(sourceName);
        SourcesService.instance.setMuted(source.id, true);
      }
    }
  }
};


// Represents a serialized Hotkey
export interface HotkeyObject {
  action: string;
  toggle: string;
  scene: string;
  source: string;
  accelerators: string[];
}


// Represents a single bindable hotkey
export class Hotkey {

  action: string;
  toggle: string;
  scene: string;
  source: string;
  accelerators: Set<string>;

  // These are injected dynamically
  downHandler: (accelerator: string) => void;
  upHandler: (accelerator: string) => void;
  description: string;

  static fromObject(obj: HotkeyObject) {
    const hotkey = new this();

    hotkey.action = obj.action;
    hotkey.toggle = obj.toggle;
    hotkey.scene = obj.scene;
    hotkey.source = obj.source;
    hotkey.accelerators = new Set(obj.accelerators || []);

    return hotkey;
  }

  toObject() {
    const obj = <HotkeyObject>{
      action: this.action,
      accelerators: Array.from(this.accelerators.values())
    };

    if (this.toggle) obj.toggle = this.toggle;
    if (this.scene) obj.scene = this.scene;
    if (this.source) obj.source = this.source;

    return obj;
  }

  // Determines if they are the same hotkey
  isSameHotkey(other: Hotkey) {
    return (this.action === other.action) &&
      (this.toggle === other.toggle) &&
      (this.scene === other.scene) &&
      (this.source === other.source);
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
      hotkeySet.addGeneralHotkeys(this.hotkeysFromAction(actionName, action));
    });

    this.scenesService.scenes.forEach(scene => {
      Object.keys(HOTKEY_ACTIONS.SCENE).forEach(actionName => {
        const action = HOTKEY_ACTIONS.SCENE[actionName] as THotkeyAction;

        if (action.perSource) {
          scene.items.forEach(sceneSource => {
            const source = this.sourcesService.getSourceById(sceneSource.sourceId);

            if (!action.shouldApply || action.shouldApply(source)) {
              hotkeySet.addSceneHotkeys(
                scene.name,
                this.hotkeysFromAction(
                  actionName,
                  action,
                  scene.name,
                  source.name
                )
              );
            }
          });
        } else {
          hotkeySet.addSceneHotkeys(
            scene.name,
            this.hotkeysFromAction(actionName, action, scene.name)
          );
        }
      });
    });

    this.sourcesService.sources.forEach((source: ISource) => {
      Object.keys(HOTKEY_ACTIONS.SOURCE).forEach(actionName => {
        const action = HOTKEY_ACTIONS.SOURCE[actionName] as THotkeyAction;

        if (!action.shouldApply || action.shouldApply(source)) {
          hotkeySet.addSourceHotkeys(
            source.name,
            this.hotkeysFromAction(
              actionName,
              action,
              undefined,
              source.name
            )
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

  hotkeysFromAction(name: string, action: THotkeyAction, scene?: string, source?: string) {
    const hotkeys: Hotkey[] = [];

    const hotkeyObj = <HotkeyObject>{
      action: name,
      scene,
      source
    };

    // Toggles result in 2 hotkeys per action
    if (action.kind === HotkeyActionKind.Toggle) {
      const onHotkey = Hotkey.fromObject(hotkeyObj);
      const offHotkey = Hotkey.fromObject(hotkeyObj);

      onHotkey.toggle = 'on';
      offHotkey.toggle = 'off';

      onHotkey.description = action.description.on(scene, source);
      offHotkey.description = action.description.off(scene, source);

      onHotkey.downHandler = accelerator => {
        // Act as a toggle
        if (offHotkey.accelerators.has(accelerator)) {
          if (action.getCurrentState(scene, source)) {
            action.off(scene, source);
          } else {
            action.on(scene, source);
          }
        } else if (!action.getCurrentState(scene, source)) {
          action.on(scene, source);
        }
      };

      offHotkey.downHandler = accelerator => {
        if (onHotkey.accelerators.has(accelerator)) {
          // We do nothing.  The on hotkey is responsible
          // for handling toggles
        } else if (action.getCurrentState(scene, source)) {
          action.off(scene, source);
        }
      };

      hotkeys.push(onHotkey);
      hotkeys.push(offHotkey);
    } else if (action.kind === HotkeyActionKind.Simple) {
      const hotkey = Hotkey.fromObject(hotkeyObj);
      hotkey.description = action.description(scene, source);

      hotkey.downHandler = () => {
        action.handler(scene, source);
      };

      hotkeys.push(hotkey);
    } else if (action.kind === HotkeyActionKind.Momentary) {
      const hotkey = Hotkey.fromObject(hotkeyObj);
      hotkey.description = action.description(scene, source);

      hotkey.downHandler = () => {
        action.down(scene, source);
      };

      hotkey.upHandler = () => {
        action.up(scene, source);
      };

      hotkeys.push(hotkey);
    }

    return hotkeys;
  }

  get bindingsFilePath() {
    return path.join(app.getPath('userData'), 'hotkeys.json');
  }

}
