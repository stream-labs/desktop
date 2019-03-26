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

  get options() {
    return this.windowsService.state[this.windowId];
  }

  get windowId() {
    return Util.getCurrentUrlParams().windowId;
  }

  get nightTheme() {
    return this.customizationService.nightMode;
  }
}
