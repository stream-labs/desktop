import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
import { remote } from 'electron';
import { StreamingService } from 'services/streaming';
import { Subscription } from 'rxjs';
import Popper from 'vue-popperjs';
import * as moment from 'moment';
import { HostsService } from 'app-services';

@Component({
  components: {
    Popper,
  },
})
export default class ProgramInfo extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;
  @Inject() streamingService: StreamingService;
  @Inject() hostsService: HostsService;

  // TODO: 後でまとめる
  programIsMemberOnlyTooltip = 'コミュニティ限定放送';

  private subscription: Subscription = null;

  showPopupMenu: boolean = false;

  get compactMode(): boolean {
    return this.nicoliveProgramService.state.isCompact;
  }

  get isOnAir(): boolean {
    return this.nicoliveProgramService.state.status === 'onAir';
  }

  mounted() {
    this.subscription = this.nicoliveProgramService.stateChange.subscribe(state => {
      if (state.status === 'end') {
        if (this.streamingService.isStreaming) {
          this.streamingService.toggleStreamingAsync();
        }
      }
    });
  }

  destroyed() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  get programID(): string {
    return this.nicoliveProgramService.state.programID;
  }

  get programStatus(): string {
    return this.nicoliveProgramService.state.status;
  }

  get programTitle(): string {
    return this.nicoliveProgramService.state.title;
  }

  get programIsMemberOnly(): boolean {
    return this.nicoliveProgramService.state.isMemberOnly;
  }

  get communityID(): string {
    return this.nicoliveProgramService.state.communityID;
  }

  get communityName(): string {
    return this.nicoliveProgramService.state.communityName;
  }

  get communitySymbol(): string {
    return this.nicoliveProgramService.state.communitySymbol;
  }

  get autoExtensionEnabled() {
    return this.nicoliveProgramService.state.autoExtensionEnabled;
  }
  toggleAutoExtension() {
    this.nicoliveProgramService.toggleAutoExtension();
  }

  openInDefaultBrowser(event: MouseEvent): void {
    const href = (event.currentTarget as HTMLAnchorElement).href;
    const url = new URL(href);
    if (/^https?/.test(url.protocol)) {
      remote.shell.openExternal(url.toString());
    }
  }

  get watchPageURL(): string {
    return this.hostsService.getWatchPageURL(this.programID);
  }

  get communityPageURL(): string {
    return this.hostsService.getCommunityPageURL(this.communityID);
  }

  isEditing: boolean = false;
  async editProgram() {
    if (this.isEditing) throw new Error('editProgram is running');
    try {
      this.isEditing = true;
      return await this.nicoliveProgramService.editProgram();
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isEditing = false;
    }
  }

  get contentTreeURL(): string {
    return this.hostsService.getContentTreeURL(this.programID);
  }

  get creatorsProgramURL(): string {
    return this.hostsService.getCreatorsProgramURL(this.programID);
  }

  get twitterShareURL(): string {
    const content = this.twitterShareContent();
    const url = new URL('https://twitter.com/intent/tweet');
    url.searchParams.append('text', content.text);
    url.searchParams.append('url', content.url);
    return url.toString();
  }

  private twitterShareContent(): { text: string; url: string } {
    const title = this.nicoliveProgramService.state.title;
    const url = `https://live.nicovideo.jp/watch/${this.programID}?ref=sharetw`;
    const time = this.nicoliveProgramService.state.startTime;
    const formattedTime = moment.unix(time).format('YYYY/MM/DD HH:mm');

    if (this.programStatus === 'reserved' || this.programStatus === 'test') {
      return {
        text: `【ニコ生(${formattedTime}開始)】${title}`,
        url,
      };
    }

    if (this.programStatus === 'onAir') {
      return {
        text: `【ニコ生配信中】${title}`,
        url,
      };
    }

    if (this.programStatus === 'end') {
      return {
        text: `【ニコ生タイムシフト視聴中(${formattedTime}放送)】${title}`,
        url,
      };
    }
  }
}
