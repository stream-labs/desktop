import _ from 'lodash';

import { Service } from './service';
import StreamingService from './streaming';
import ScenesService from './scenes';
import SourcesService from './sources';

const { globalShortcut, app } = window.require('electron').remote;
const path = window.require('path');
const fs = window.require('fs');

// All possible hotkeys should be defined in this object.
// All information about the hotkey and its behavior is
// encapsulated within the action definition here.
//
// WARNING: Changing the name of existing hotkey actions
// will cause people to lose their saved keybindings. The
// name shouldn't really change after it is added.
const HOTKEY_ACTIONS = {
  GENERAL: {
    TOGGLE_STREAMING: {
      actsAsToggle: true,
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

    TOGGLE_RECORDING: {
      actsAsToggle: true,
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
    TOGGLE_SOURCE_VISIBILITY: {
      actsAsToggle: true,
      perSource: true,
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
        const mergedSource = ScenesService.instance.getMergedSource(scene.id, source.id);

        return mergedSource.visible;
      },
      on(sceneName, sourceName) {
        const scene = ScenesService.instance.getSceneByName(sceneName);
        const source = SourcesService.instance.getSourceByName(sourceName);

        ScenesService.instance.setSourceVisibility(scene.id, source.id, true);
      },
      off(sceneName, sourceName) {
        const scene = ScenesService.instance.getSceneByName(sceneName);
        const source = SourcesService.instance.getSourceByName(sourceName);

        ScenesService.instance.setSourceVisibility(scene.id, source.id, false);
      }
    },

    SWITCH_TO_SCENE: {
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
    TOGGLE_MUTE: {
      actsAsToggle: true,
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
    }
  }
};

// Represents a single bindable hotkey
class Hotkey {

  // In this case, the object is a plain JS object
  // that uniquely represents this Hotkey.  This is
  // needed so we can store it as JSON and identify
  // it later.
  static fromObject(obj) {
    const hotkey = new this();

    hotkey.action = obj.action;
    hotkey.toggle = obj.toggle;
    hotkey.scene = obj.scene;
    hotkey.source = obj.source;
    hotkey.accelerators = new Set(obj.accelerators || []);

    return hotkey;
  }

  toObject() {
    const obj = {
      action: this.action,
      accelerators: Array.from(this.accelerators.values())
    };

    if (this.toggle) obj.toggle = this.toggle;
    if (this.scene) obj.scene = this.scene;
    if (this.source) obj.source = this.source;

    return obj;
  }

  // Determines if they are the same hotkey
  isSameHotkey(other) {
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
class HotkeySet {

  constructor() {
    this.generalHotkeys = [];
    this.sceneHotkeys = new Map();
    this.sourceHotkeys = new Map();
  }

  addGeneralHotkeys(hotkeys) {
    this.generalHotkeys = this.generalHotkeys.concat(hotkeys);
  }

  addSceneHotkeys(scene, hotkeys) {
    const sceneHotkeys = this.sceneHotkeys.get(scene) || [];
    this.sceneHotkeys.set(scene, sceneHotkeys.concat(hotkeys));
  }

  addSourceHotkeys(source, hotkeys) {
    const sourceHotkeys = this.sourceHotkeys.get(source) || [];
    this.sourceHotkeys.set(source, sourceHotkeys.concat(hotkeys));
  }

  getGeneralHotkeys() {
    return this.generalHotkeys;
  }

  getSceneHotkeys(scene) {
    return this.sceneHotkeys.get(scene) || [];
  }

  getSourceHotkeys(source) {
    return this.sourceHotkeys.get(source) || [];
  }

  // Returns a single array of all hotkeys
  getAllHotkeys() {
    const hotkeys = [
      this.generalHotkeys,
      Array.from(this.sceneHotkeys.values()),
      Array.from(this.sourceHotkeys.values())
    ];

    return _.flattenDeep(hotkeys);
  }

}

export default class HotkeysService extends Service {

  // Loads the config from disk, and binds all current hotkeys
  bindAllHotkeys() {
    const set = this.getHotkeySet();
    this.bindHotkeySet(set);
  }

  unregisterAll() {
    globalShortcut.unregisterAll();
  }

  // Initializes all hotkeys from the action map, and
  // loads and reconciles all current bindings.
  getHotkeySet() {
    const hotkeySet = new HotkeySet();

    Object.keys(HOTKEY_ACTIONS.GENERAL).forEach(actionName => {
      const action = HOTKEY_ACTIONS.GENERAL[actionName];
      hotkeySet.addGeneralHotkeys(this.hotkeysFromAction(actionName, action));
    });

    ScenesService.instance.scenes.forEach(scene => {
      Object.keys(HOTKEY_ACTIONS.SCENE).forEach(actionName => {
        const action = HOTKEY_ACTIONS.SCENE[actionName];

        if (action.perSource) {
          scene.sources.forEach(source => {
            const name = SourcesService.instance.getSourceById(source.id).name;

            hotkeySet.addSceneHotkeys(
              scene.name,
              this.hotkeysFromAction(
                actionName,
                action,
                scene.name,
                name
              )
            );
          });
        } else {
          hotkeySet.addSceneHotkeys(
            scene.name,
            this.hotkeysFromAction(actionName, action, scene.name)
          );
        }
      });
    });

    SourcesService.instance.sources.forEach(source => {
      Object.keys(HOTKEY_ACTIONS.SOURCE).forEach(actionName => {
        const action = HOTKEY_ACTIONS.SOURCE[actionName];

        if (action.shouldApply(source)) {
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
  applyHotkeySet(hotkeySet) {
    this.saveHotkeySet(hotkeySet);
    this.bindHotkeySet(hotkeySet);
  }

  // Saves the hotkey set to the configuration file
  saveHotkeySet(hotkeySet) {
    const bindings = [];

    hotkeySet.getAllHotkeys().forEach(hotkey => {
      if (hotkey.isBound()) {
        bindings.push(hotkey.toObject());
      }
    });

    // TODO: Actually save this object
    fs.writeFileSync(this.bindingsFilePath, JSON.stringify({ bindings }));
  }

  bindHotkeySet(hotkeySet) {
    globalShortcut.unregisterAll();

    const acceleratorMap = new Map();

    // We need to group all hotkeys by accelerator, since electron
    // does not support binding multiple callbacks to the same
    // accelerator.
    hotkeySet.getAllHotkeys().forEach(hotkey => {
      if (hotkey.isBound()) {
        hotkey.accelerators.forEach(accelerator => {
          const handlers = acceleratorMap.get(accelerator) || [];
          handlers.push(hotkey.handler);
          acceleratorMap.set(accelerator, handlers);
        });
      }
    });

    for (const [accelerator, handlers] of acceleratorMap.entries()) {
      globalShortcut.register(accelerator, () => {
        handlers.forEach(handler => {
          handler(accelerator);
        });
      });
    }
  }

  // This is a slow O(n^2) process, and may need to
  // be optimized later.
  loadBindingsIntoHotkeys(hotkeys) {
    const bindings = this.loadBindings();

    hotkeys.forEach(hotkey => {
      bindings.forEach(binding => {
        if (hotkey.isSameHotkey(binding)) {
          hotkey.accelerators = binding.accelerators;
        }
      });
    });
  }

  loadBindings() {
    if (fs.existsSync(this.bindingsFilePath)) {
      const parsed = JSON.parse(fs.readFileSync(this.bindingsFilePath)).bindings;

      return parsed.map(binding => {
        return Hotkey.fromObject(binding);
      });
    }

    return [];
  }

  hotkeysFromAction(name, action, scene, source) {
    const hotkeys = [];

    const hotkeyObj = {
      action: name,
      scene,
      source
    };

    // Toggles result in 2 hotkeys per action
    if (action.actsAsToggle) {
      const onHotkey = Hotkey.fromObject(hotkeyObj);
      const offHotkey = Hotkey.fromObject(hotkeyObj);

      onHotkey.toggle = 'on';
      offHotkey.toggle = 'off';

      onHotkey.description = action.description.on(scene, source);
      offHotkey.description = action.description.off(scene, source);

      onHotkey.handler = accelerator => {
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

      offHotkey.handler = accelerator => {
        if (onHotkey.accelerators.has(accelerator)) {
          // We do nothing.  The on hotkey is responsible
          // for handling toggles
        } else if (action.getCurrentState(scene, source)) {
          action.off(scene, source);
        }
      };

      hotkeys.push(onHotkey);
      hotkeys.push(offHotkey);
    } else {
      const hotkey = Hotkey.fromObject(hotkeyObj);
      hotkey.description = action.description(scene, source);

      hotkey.handler = () => {
        action.handler(scene, source);
      };

      hotkeys.push(hotkey);
    }

    return hotkeys;
  }

  get bindingsFilePath() {
    return path.join(app.getPath('userData'), 'hotkeys.json');
  }

}
