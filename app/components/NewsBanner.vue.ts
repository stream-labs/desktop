import Vue from 'vue';
import { shell } from 'electron';
import emojione from 'emojione';
import { AnnouncementsService } from 'services/announcements';
import { Inject } from 'util/injector';

export default class NewsBanner extends Vue {
  @Inject() announcementsService: AnnouncementsService;

  get currentBanner() {
    return this.announcementsService.state;
  }

  get bannerExists() {
    return this.announcementsService.bannerExists();
  }

  get headerText() {
    return emojione.shortnameToUnicode(this.currentBanner.header);
  }

  closeBanner() {
    this.announcementsService.closeBanner();
  }

  followLink() {
    shell.openExternal(this.currentBanner.link);
  }
}
