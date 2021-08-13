import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ModalLayout from 'components/ModalLayout.vue';
import { WindowsService } from 'services/windows';
import AddSourceInfo from './AddSourceInfo.vue';
import { SourcesService, TSourceType, TPropertiesManager } from 'services/sources';
import { ScenesService } from 'services/scenes';
import { UserService } from 'services/user';
import BrowserSourceIcon from '../../../media/images/browser-source-icon.svg';
import ColorSourceIcon from '../../../media/images/color-source-icon.svg';
import DshowInputIcon from '../../../media/images/display-icon.svg';
// eslint-disable-next-line import/no-duplicates
import ImageSourceIcon from '../../../media/images/slideshow-icon.svg';
import WindowCaptureIcon from '../../../media/images/window-capture-icon.svg';
import AddSceneIcon from '../../../media/images/add-scene-icon.svg';
import AddFileIcon from '../../../media/images/add-file-icon.svg';
import WasapiInputCaptureIcon from '../../../media/images/wasapi-input-icon.svg';
import GameCaptureIcon from '../../../media/images/game-capture-icon.svg';
import TextGdiplusIcon from '../../../media/images/text-gdiplus-icon.svg';
import FfmpegSourceIcon from '../../../media/images/ffmpeg-source-icon.svg';
// eslint-disable-next-line import/no-duplicates
import SlideshowIcon from '../../../media/images/slideshow-icon.svg';
import WasapiOutputIcon from '../../../media/images/wasapi-output-icon.svg';
import MonitorCaptureIcon from '../../../media/images/monitor-capture-icon.svg';
import NdiSourceIcon from '../../../media/images/ndi-icon.svg';
import BlackmagicSourceIcon from '../../../media/images/blackmagic-icon.svg';

type TInspectableSource = TSourceType;

interface ISelectSourceOptions {
  propertiesManager?: TPropertiesManager;
}

@Component({
  components: {
    ModalLayout,
    AddSourceInfo,
    BrowserSourceIcon,
    ColorSourceIcon,
    DshowInputIcon,
    ImageSourceIcon,
    WindowCaptureIcon,
    AddSceneIcon,
    AddFileIcon,
    WasapiInputCaptureIcon,
    TextGdiplusIcon,
    GameCaptureIcon,
    FfmpegSourceIcon,
    SlideshowIcon,
    WasapiOutputIcon,
    MonitorCaptureIcon,
    NdiSourceIcon,
    BlackmagicSourceIcon,
  },
})
export default class SourcesShowcase extends Vue {
  @Inject() sourcesService: SourcesService;
  @Inject() userService: UserService;
  @Inject() scenesService: ScenesService;
  @Inject() windowsService: WindowsService;

  selectSource(sourceType: TSourceType, options: ISelectSourceOptions = {}) {
    const managerType = options.propertiesManager || 'default';

    this.sourcesService.showAddSource(sourceType, {
      propertiesManager: managerType,
      propertiesManagerSettings: {},
    });
  }

  inspectedSource: TInspectableSource = null;

  inspectSource(inspectedSource: TInspectableSource) {
    this.inspectedSource = inspectedSource;
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get platform() {
    if (!this.loggedIn) return null;
    return this.userService.platform.type;
  }

  selectInspectedSource() {
    if (
      this.sourcesService.getAvailableSourcesTypes().includes(this.inspectedSource as TSourceType)
    ) {
      this.selectSource(this.inspectedSource as TSourceType);
    }
  }

  get availableSources() {
    return this.sourcesService.getAvailableSourcesTypesList().filter(type => {
      if (type.value === 'text_ft2_source') return false;
      if (type.value === 'scene' && this.scenesService.scenes.length <= 1) return false;
      return true;
    });
  }
}
