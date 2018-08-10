import Vue from 'vue';
import { shell } from 'electron';
import emojione from 'emojione';
import { NewsBannerService} from 'services/news-banner';
import { Inject } from 'util/injector';

export default class NewsBanner extends Vue {
  @Inject() newsBannerService: NewsBannerService;

  get currentBanner() {
    return this.newsBannerService.state;
  }

  get bannerExists() {
    return this.newsBannerService.bannerExists();
  }

  get headerText() {
    return emojione.toImage(this.currentBanner.header);
  }

  closeBanner() {
    this.newsBannerService.closeBanner();
  }

  followLink() {
    shell.openExternal(this.currentBanner.link);
  }
}
