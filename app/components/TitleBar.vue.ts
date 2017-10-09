import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import electron from 'electron';
import { CustomizationService } from '../services/customization';
import { Inject } from '../util/injector';

@Component({})
export default class TitleBar extends Vue {

  @Inject()
  customizationService: CustomizationService;

  @Prop()
  title: string;

  minimize() {
    electron.remote.getCurrentWindow().minimize();
  }

  maximize() {
    const win = electron.remote.getCurrentWindow();

    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }

  close() {
    electron.remote.getCurrentWindow().close();
  }

  get nightMode() {
    return this.customizationService.nightMode;
  }

}
