import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';
import { GuestApiService } from 'services/guest-api';
import { NavigationService } from 'services/navigation';
import { SceneCollectionsService } from 'services/scene-collections';
import { IDownloadProgress } from 'services/scene-collections/overlays';
import urlLib from 'url';
import electron from 'electron';

@Component({})
export default class BrowseOverlays extends Vue {
  @Inject() userService: UserService;
  @Inject() guestApiService: GuestApiService;
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Inject() navigationService: NavigationService;

  $refs: {
    overlaysWebview: Electron.WebviewTag;
  };

  mounted() {
    this.guestApiService.exposeApi(this.$refs.overlaysWebview, {
      installOverlay: this.installOverlay
    });

    this.$refs.overlaysWebview.addEventListener('new-window', e => {
      const protocol = urlLib.parse(e.url).protocol;

      if (protocol === 'http:' || protocol === 'https:') {
        electron.remote.shell.openExternal(e.url);
      }
    });
  }

  async installOverlay(
    url: string,
    name: string,
    progressCallback?: (progress: IDownloadProgress) => void
  ) {
    const host = (new urlLib.URL(url)).hostname;
    const trustedHosts = ['cdn.streamlabs.com'];

    if (!trustedHosts.includes(host)) {
      console.error(`Ignoring overlay install from untrusted host: ${host}`);
      return;
    }

    await this.sceneCollectionsService.installOverlay(url, name, progressCallback);
    this.navigationService.navigate('Studio');
  }

  get overlaysUrl() {
    return this.userService.overlaysUrl();
  }
}
