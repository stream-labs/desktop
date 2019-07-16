import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'services/core/injector';
import { GuestApiService } from 'services/guest-api';
import electron from 'electron';
import { NavigationService, TAppPage } from 'services/navigation';
import BrowserView from 'components/shared/BrowserView';

@Component({
  components: { BrowserView },
})
export default class Dashboard extends Vue {
  @Inject() userService: UserService;
  @Inject() guestApiService: GuestApiService;
  @Inject() navigationService: NavigationService;
  @Prop() params: Dictionary<string>;

  onBrowserViewReady(view: Electron.BrowserView) {
    view.webContents.on('did-finish-load', () => {
      this.guestApiService.exposeApi(view.webContents.id, {
        navigate: this.navigate,
      });
    });

    electron.ipcRenderer.send('webContents-preventPopup', view.webContents.id);

    view.webContents.on('new-window', (e, url) => {
      electron.remote.shell.openExternal(url);
    });
  }

  get dashboardUrl() {
    return this.userService.dashboardUrl(this.params.subPage || '');
  }

  async navigate(page: TAppPage) {
    this.navigationService.navigate(page);
  }
}
