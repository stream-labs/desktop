import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import ModalLayout from 'components/ModalLayout.vue';
import { WindowsService } from 'services/windows';
import windowMixin from 'components/mixins/window';
import AddSourceInfo from './AddSourceInfo.vue';
import { SourcesService, TSourceType, TPropertiesManager } from 'services/sources';
import { ScenesService } from 'services/scenes';
import { UserService } from 'services/user';
const BrowserSourceIcon = require('../../../media/images/browser-source-icon.svg');
const ColorSourceIcon = require('../../../media/images/color-source-icon.svg');
const DshowInputIcon = require('../../../media/images/display-icon.svg');
const ImageSourceIcon = require('../../../media/images/slideshow-icon.svg');
const WindowCaptureIcon = require('../../../media/images/window-capture-icon.svg');
const AddSceneIcon = require('../../../media/images/add-scene-icon.svg');
const AddFileIcon = require('../../../media/images/add-file-icon.svg');
const WasapiInputCaptureIcon = require('../../../media/images/wasapi-input-icon.svg');
const GameCaptureIcon = require('../../../media/images/game-capture-icon.svg');
const TextGdiplusIcon = require('../../../media/images/text-gdiplus-icon.svg');
const FfmpegSourceIcon = require('../../../media/images/ffmpeg-source-icon.svg');
const SlideshowIcon = require('../../../media/images/slideshow-icon.svg');
const WasapiOutputIcon = require('../../../media/images/wasapi-output-icon.svg');
const MonitorCaptureIcon = require('../../../media/images/monitor-capture-icon.svg');
const NdiSourceIcon = require('../../../media/images/ndi-icon.svg');

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
    NdiSourceIcon
  },
  mixins: [windowMixin],
})
export default class SourcesShowcase extends Vue {
  @Inject() sourcesService: SourcesService;
  @Inject() userService: UserService;
  @Inject() scenesService: ScenesService;
  @Inject() windowsService: WindowsService;

  selectSource(sourceType: TSourceType, options: ISelectSourceOptions = {}) {
    const managerType = options.propertiesManager || 'default';

    const sameTypeCount = this.sourcesService.getSources()
      .filter((source) => {
        return source.isSameType({
          type: sourceType,
          propertiesManager: managerType,
        });
      })
      .length;

    if (sameTypeCount > 0) {
      this.sourcesService.showAddSource(sourceType, managerType);
    } else {
      this.sourcesService.showNameSource(sourceType, managerType);
    }
  }

  inspectedSource: TInspectableSource = null;

  inspectSource(inspectedSource: TInspectableSource) {
    this.inspectedSource = inspectedSource;
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get platform() {
    return this.userService.platform.type;
  }

  selectInspectedSource() {
    if (this.sourcesService.getAvailableSourcesTypes().includes(this.inspectedSource as TSourceType)) {
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
