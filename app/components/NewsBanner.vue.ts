import Vue from 'vue';
import { shell } from 'electron';
import emojione from 'emojione';
import { AnnouncementsService } from 'services/announcements';
import { Inject } from 'util/injector';
import { Component } from 'vue-property-decorator';

@Component({})
export default class NewsBanner extends Vue {
  @Inject() announcementsService: AnnouncementsService;

  proceessingClose = false;


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
    this.proceessingClose = true;
    await this.announcementsService.closeBanner();
    this.proceessingClose = false;
  }

  followLink() {
    shell.openExternal(this.currentBanner.link);
  }
}
