import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';
import { GuestApiService } from 'services/guest-api';
import { IDownloadProgress } from 'services/scenes-collections';
import { AppService } from 'services/app';

@Component({})
export default class BrowseOverlays extends Vue {
  @Inject() userService: UserService;
  @Inject() guestApiService: GuestApiService;
  @Inject() appService: AppService;

  $refs: {
    overlaysWebview: Electron.WebviewTag;
  };

  mounted() {
    this.guestApiService.exposeApi(this.$refs.overlaysWebview, {
      installOverlay: this.installOverlay
    });

    this.$refs.overlaysWebview.addEventListener('dom-ready', () => {
      this.$refs.overlaysWebview.openDevTools();
    });
  }

  async installOverlay(
    url: string,
    progressCallback?: (progress: IDownloadProgress) => void
  ) {
    console.log(this);
    console.log('Called installOverlay');

    // TODO: Perform some security checking of the URL hostname
    this.appService.installOverlay(url, progressCallback);
  }

  get overlaysUrl() {
    return this.userService.overlaysUrl();
  }
}
