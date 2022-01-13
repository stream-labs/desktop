import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
import { remote } from 'electron';
import { $t } from 'services/i18n';
import { StreamingService } from 'services/streaming';
import {
  NicoliveFailure,
  openErrorDialogFromFailure,
} from 'services/nicolive-program/NicoliveFailure';
import { Subscription } from 'rxjs';
import Popper from 'vue-popperjs';
import * as moment from 'moment';

@Component({
  components: {
    Popper,
  },
})
export default class ProgramInfo extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;
  @Inject() streamingService: StreamingService;

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

  isCreating: boolean = false;
  async createProgram() {
    if (this.isCreating) throw new Error('createProgram is running');
    try {
      this.isCreating = true;
      return await this.nicoliveProgramService.createProgram();
    } catch (caught) {
      if (caught instanceof NicoliveFailure) {
        await openErrorDialogFromFailure(caught);
      } else {
        throw caught;
      }
    } finally {
      this.isCreating = false;
    }
  }

  get isFetching(): boolean {
    return this.nicoliveProgramService.state.isFetching;
  }
  async fetchProgram(): Promise<void> {
    if (this.isFetching) throw new Error('fetchProgram is running');
    try {
      await this.nicoliveProgramService.fetchProgram();
    } catch (caught) {
      if (caught instanceof NicoliveFailure) {
        await openErrorDialogFromFailure(caught);
      } else {
        throw caught;
      }
    }
  }

  get isStarting(): boolean {
    return this.nicoliveProgramService.state.isStarting;
  }
  async startProgram() {
    if (this.isStarting) throw new Error('startProgram is running');
    try {
      await this.nicoliveProgramService.startProgram();

      // もし配信開始してなかったら確認する
      if (!this.streamingService.isStreaming) {
        const startStreaming = await new Promise(resolve => {
          // TODO: 翻訳
          remote.dialog.showMessageBox(
            remote.getCurrentWindow(),
            {
              type: 'warning',
              message: $t('program-info.start-streaming-confirmation'),
              buttons: [$t('streaming.goLive'), $t('program-info.later')],
              noLink: true,
            },
            idx => resolve(idx === 0),
          );
        });
        if (startStreaming) {
          // 開始
          await this.streamingService.toggleStreamingAsync();
        }
      }
    } catch (caught) {
      if (caught instanceof NicoliveFailure) {
        await openErrorDialogFromFailure(caught);
      } else {
        throw caught;
      }
    }
  }

  get isEnding(): boolean {
    return this.nicoliveProgramService.state.isEnding;
  }
  async endProgram() {
    if (this.isEnding) throw new Error('endProgram is running');
    try {
      const isOk = await new Promise(resolve => {
        // TODO: 翻訳
        remote.dialog.showMessageBox(
          remote.getCurrentWindow(),
          {
            type: 'warning',
            message: '番組を終了しますか？',
            buttons: ['終了する', $t('common.cancel')],
            noLink: true,
          },
          idx => resolve(idx === 0),
        );
      });

      if (isOk) {
        return await this.nicoliveProgramService.endProgram();
      }
    } catch (caught) {
      if (caught instanceof NicoliveFailure) {
        // 終了済み番組を終了しようとした場合は黙って番組情報を更新する
        if (caught.type === 'http_error' && caught.reason === '409') {
          return this.refreshProgram();
        }
        await openErrorDialogFromFailure(caught);
      } else {
        throw caught;
      }
    }
  }

  private async refreshProgram() {
    try {
      return await this.nicoliveProgramService.refreshProgram();
    } catch (caught) {
      if (caught instanceof NicoliveFailure) {
        await openErrorDialogFromFailure(caught);
      } else {
        throw caught;
      }
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
    return `https://live.nicovideo.jp/watch/${this.programID}`;
  }

  get communityPageURL(): string {
    return `https://com.nicovideo.jp/community/${this.communityID}`;
  }

  // TODO: ProgramStatistics.vue.ts から移植しただけなので後で整理する
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
    return `https://commons.nicovideo.jp/tree/${this.programID}`;
  }

  get creatorsProgramURL(): string {
    return `https://commons.nicovideo.jp/cpp/application/?site_id=nicolive&creation_id=${this.programID}`;
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
