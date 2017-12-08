import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';
import { GuestApiService } from 'services/guest-api';
import { IDownloadProgress } from 'services/scenes-collections';
import { AppService } from 'services/app';
import { NavigationService } from 'services/navigation';
import urlLib from 'url';

@Component({})
export default class BrowseOverlays extends Vue {
  @Inject() userService: UserService;
  @Inject() guestApiService: GuestApiService;
  @Inject() appService: AppService;
  @Inject() navigationService: NavigationService;

  $refs: {
    overlaysWebview: Electron.WebviewTag;
  };

  mounted() {
    this.guestApiService.exposeApi(this.$refs.overlaysWebview, {
      installOverlay: this.installOverlay
    });
  }

  async installOverlay(
    url: string,
    progressCallback?: (progress: IDownloadProgress) => void
  ) {
    const host = (new urlLib.URL(url)).hostname;
    const trustedHosts = ['cdn.streamlabs.com'];

    if (!trustedHosts.includes(host)) {
      console.error(`Ignoring overlay install from untrusted host: ${host}`);
      return;
    }

    await this.appService.installOverlay(url, progressCallback);
    this.navigationService.navigate('Studio');
  }

  get overlaysUrl() {
    return this.userService.overlaysUrl();
  }
}
