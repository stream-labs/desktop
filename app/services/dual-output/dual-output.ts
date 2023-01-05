import { PersistentStatefulService, InitAfter, Inject, ViewHandler, mutation } from 'services/core';
import {
  TDualOutputPlatformSettings,
  DualOutputPlatformSettings,
  EDualOutputPlatform,
  TOutputDisplayType,
  IDualOutputPlatformSetting,
} from './dual-output-data';
import { ScenesService } from 'services/scenes';
import { CopyNodesCommand } from 'services/editor-commands/commands';
interface IDualOutputServiceState {
  platformSettings: TDualOutputPlatformSettings;
  isHorizontalActive: boolean;
  isVerticalActive: boolean;
  dualOutputMode: boolean;
  horizontalSceneId: string;
  verticalSceneId: string;
  // nodeMap: Dictionary @@@ HERE writing map for nodes so that horizontal and vertical nodes toggle correctly
}

export type TDualOutputDisplayType = 'horizontal' | 'vertical';

class DualOutputViews extends ViewHandler<IDualOutputServiceState> {
  get dualOutputMode() {
    return this.state.dualOutputMode;
  }

  get isHorizontalActive() {
    return this.state.isHorizontalActive;
  }

  get isVerticalActive() {
    return this.state.isVerticalActive;
  }

  get platformSettings() {
    return this.state.platformSettings;
  }

  get platformSettingsList(): IDualOutputPlatformSetting[] {
    return Object.values(this.state.platformSettings);
  }

  get horizontalSceneId() {
    return this.state.horizontalSceneId;
  }

  get verticalSceneId() {
    return this.state.verticalSceneId;
  }

  get hasDualOutputScenes() {
    return this.state.horizontalSceneId || this.state.verticalSceneId;
  }
}

@InitAfter('UserService')
@InitAfter('ScenesService')
// @@@ maybe @InitAfter('SourcesService')
export class DualOutputService extends PersistentStatefulService<IDualOutputServiceState> {
  @Inject() private scenesService: ScenesService;

  static defaultState: IDualOutputServiceState = {
    platformSettings: DualOutputPlatformSettings,
    dualOutputMode: false,
    isHorizontalActive: true,
    isVerticalActive: true,
    horizontalSceneId: null,
    verticalSceneId: null,
  };
  get views() {
    return new DualOutputViews(this.state);
  }

  init() {
    super.init();
  }

  toggleDualOutputMode(status?: boolean) {
    this.TOGGLE_DUAL_OUTPUT_MODE(status);
  }

  toggleVerticalVisibility(status?: boolean) {
    this.TOGGLE_VERTICAL_VISIBILITY(status);
  }

  toggleHorizontalVisibility(status?: boolean) {
    this.TOGGLE_HORIZONTAL_VISIBILITY(status);
  }

  updatePlatformSetting(platform: EDualOutputPlatform | string, setting: TOutputDisplayType) {
    this.UPDATE_PLATFORM_SETTING(platform, setting);
  }

  setDualOutputScenes(sceneId: string) {
    if (this.views.hasDualOutputScenes) {
      // For performance, we only want one set of dual output scenes active at any time
      // so when the user changes the active scene, we destroy the dual output scenes.

      // Determine if this is a change in the active scene
      // We only need to check one of the dual output scene ids
      // because they are created at the same time from the same active scene.
      const lastIndex = this.state.horizontalSceneId.lastIndexOf('_');
      this.state.horizontalSceneId.slice(0, lastIndex - 2);
      const currentSceneId = this.state.horizontalSceneId.slice(0, lastIndex - 2);

      if (currentSceneId === sceneId) {
        return;
      } else {
        this.destroyDualOutputScenes();
      }
    }

    const nodesToCopy = this.scenesService.views.getScene(sceneId).getSelection().selectAll();

    const horizontalScene = this.scenesService.createScene(`${sceneId}_horizontal`, {
      sceneId: `${sceneId}_horizontal`,
      makeActive: false,
    });
    const verticalScene = this.scenesService.createScene(`${sceneId}_vertical`, {
      sceneId: `${sceneId}_vertical`,
      makeActive: false,
    });

    const horizontalCopyNodesCommand = new CopyNodesCommand(nodesToCopy, horizontalScene.state.id);
    horizontalCopyNodesCommand.execute();

    const verticalCopyNodesCommand = new CopyNodesCommand(nodesToCopy, verticalScene.state.id);
    verticalCopyNodesCommand.execute();

    if (!this.state.dualOutputMode) {
      this.toggleDualOutputMode(true);
    }
    this.SET_DUAL_OUTPUT_SCENES(horizontalScene.state.id, verticalScene.state.id);
  }

  destroyDualOutputScenes() {
    if (this.views.hasDualOutputScenes) {
      // remove dual output scenes
      this.scenesService.removeScene(this.state.horizontalSceneId, true);
      this.scenesService.removeScene(this.state.verticalSceneId, true);
      // reset data for dual output scenes
      this.REMOVE_DUAL_OUTPUT_SCENES();
    }
  }

  shutdown() {
    this.destroyDualOutputScenes();
  }

  @mutation()
  private TOGGLE_DUAL_OUTPUT_MODE(status?: boolean) {
    if (typeof status === 'undefined') {
      this.state.dualOutputMode = !this.state.dualOutputMode;
    } else {
      this.state.dualOutputMode = status;
    }
  }

  @mutation()
  private TOGGLE_HORIZONTAL_VISIBILITY(status?: boolean) {
    // console.log('horizontal ', status);
    if (typeof status === 'undefined' || 'null') {
      this.state.isHorizontalActive = !this.state.isHorizontalActive;
    } else {
      this.state.isHorizontalActive = status;
    }
  }

  @mutation()
  private TOGGLE_VERTICAL_VISIBILITY(status?: boolean) {
    // console.log('vertical ', status);
    if (typeof status === 'undefined' || 'null') {
      this.state.isVerticalActive = !this.state.isVerticalActive;
    } else {
      this.state.isVerticalActive = status;
    }
  }

  @mutation()
  private UPDATE_PLATFORM_SETTING(
    platform: EDualOutputPlatform | string,
    setting: TOutputDisplayType,
  ) {
    this.state.platformSettings[platform] = {
      ...this.state.platformSettings[platform],
      setting,
    };
  }

  @mutation()
  private SET_DUAL_OUTPUT_SCENES(horizontalSceneId: string, verticalSceneId: string) {
    this.state = {
      ...this.state,
      horizontalSceneId,
      verticalSceneId,
    };
  }

  @mutation()
  private REMOVE_DUAL_OUTPUT_SCENES() {
    this.state = {
      ...this.state,
      horizontalSceneId: null,
      verticalSceneId: null,
    };
  }
}
