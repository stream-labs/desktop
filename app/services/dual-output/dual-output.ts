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
}

@InitAfter('UserService')
@InitAfter('ScenesService')
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

  toggleDualOutputMode() {
    this.TOGGLE_DUAL_OUTPUT_MODE();
  }

  setDualOutputMode(status: boolean) {
    this.SET_DUAL_OUTPUT_MODE(status);
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

  setTemporaryScenes(sceneId: string) {
    // @@@ TODO: delete the line below when removing temporary scenes when changing active scene is implemented
    if (['horizontal', 'vertical'].includes(sceneId.split('_')[2])) return;

    const nodesToCopy = this.scenesService.views.getScene(sceneId).getSelection().selectAll();

    const horizontalScene = this.scenesService.createScene(`${sceneId}_horizontal`, {
      sceneId: `${sceneId}_horizontal`,
      makeActive: false,
    });
    const verticalScene = this.scenesService.createScene(`${sceneId}_vertical`, {
      sceneId: `${sceneId}_vertical`,
      makeActive: false,
    });

    console.log('horizontalScene ', horizontalScene.state);
    console.log('verticalScene ', verticalScene.state);

    const horizontalCopyNodesCommand = new CopyNodesCommand(nodesToCopy, horizontalScene.state.id);
    horizontalCopyNodesCommand.execute();

    const verticalCopyNodesCommand = new CopyNodesCommand(nodesToCopy, verticalScene.state.id);
    verticalCopyNodesCommand.execute();

    this.SET_TEMPORARY_SCENES(horizontalScene.state.id, verticalScene.state.id);
  }

  @mutation()
  private SET_DUAL_OUTPUT_MODE(status: boolean) {
    this.state.dualOutputMode = status;
    this.state.isHorizontalActive = status;
    this.state.isVerticalActive = status;
  }

  @mutation()
  private TOGGLE_DUAL_OUTPUT_MODE(status?: boolean) {
    // console.log('toggle horizontalContext ', this.state.horizontalContext);
    // console.log('toggle verticalContext ', this.state.verticalContext);
    if (typeof status === 'undefined') {
      this.state.dualOutputMode = !this.state.dualOutputMode;
    } else {
      this.state.dualOutputMode = status;
    }

    if (this.state.dualOutputMode === false) {
      // reset so both displays will always show when dual output is toggled on
      this.state.isVerticalActive = true;
      this.state.isHorizontalActive = true;
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
  private SET_TEMPORARY_SCENES(horizontalSceneId: string, verticalSceneId: string) {
    this.state.horizontalSceneId = horizontalSceneId;
    this.state.verticalSceneId = verticalSceneId;
  }
}
