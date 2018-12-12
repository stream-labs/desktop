import Vue from 'vue';
import { shell } from 'electron';
import emojione from 'emojione';
import { AnnouncementsService } from 'services/announcements';
import { Inject } from 'util/injector';
import { Component } from 'vue-property-decorator';
import { NavigationService, TAppPage } from 'services/navigation';

@Component({})
export default class NewsBanner extends Vue {
  @Inject() announcementsService: AnnouncementsService;
  @Inject() navigationService: NavigationService;

  processingClose = false;


  get currentBanner() {
    return this.announcementsService.state;
  }

  get bannerExists() {
    return this.announcementsService.bannerExists();
  }

  get headerText() {
    return emojione.shortnameToUnicode(this.currentBanner.header);
  }

  async closeBanner() {
    this.processingClose = true;
    await this.announcementsService.closeBanner();
    this.processingClose = false;
  }

  followLink() {
    if (!this.currentBanner) return;
    if (this.currentBanner.linkTarget === 'slobs') {
      this.navigationService.navigate(this.currentBanner.link as TAppPage, this.currentBanner.params);
    } else {
      shell.openExternal(this.currentBanner.link);
    }
    if (this.currentBanner.closeOnLink) {
      this.closeBanner();
    }
  }
}
