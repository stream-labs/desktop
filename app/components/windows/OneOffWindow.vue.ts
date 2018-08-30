import Vue from 'vue';
import electron from 'electron';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { getComponents, WindowsService } from 'services/windows';
import { CustomizationService } from 'services/customization';
import TitleBar from '../TitleBar.vue';

@Component({
  components: {
    TitleBar,
    ...getComponents()
  }
})
export default class OneOffWindow extends Vue {
  @Inject() private customizationService: CustomizationService;

  created() {
    // electron.remote.getCurrentWindow().setTitle(this.options.title);
  }

  get nightTheme() {
    return this.customizationService.nightMode;
  }

  get isFullScreen() {
    return electron.remote.getCurrentWindow().isFullScreen();
  }
}
