import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { getComponents, WindowsService } from 'services/windows';
import { CustomizationService } from 'services/customization';
import Util from 'services/utils';
import TitleBar from '../TitleBar.vue';

@Component({
  components: {
    TitleBar,
    ...getComponents(),
  },
})
export default class OneOffWindow extends Vue {
  @Inject() private customizationService: CustomizationService;
  @Inject() private windowsService: WindowsService;

  created() {
    window.addEventListener('resize', this.windowSizeHandler);
  }

  destroyed() {
    window.removeEventListener('resize', this.windowSizeHandler);
  }

  get options() {
    return this.windowsService.state[this.windowId];
  }

  get windowId() {
    return Util.getCurrentUrlParams().windowId;
  }

  get theme() {
    return this.customizationService.currentTheme;
  }

  windowResizeTimeout: number;

  windowSizeHandler() {
    if (!this.windowsService.state[this.windowId].hideStyleBlockers) {
      this.windowsService.updateStyleBlockers(this.windowId, true);
    }
    clearTimeout(this.windowResizeTimeout);

    this.windowResizeTimeout = window.setTimeout(
      () => this.windowsService.updateStyleBlockers(this.windowId, false),
      200,
    );
  }
}
