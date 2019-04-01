import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import * as moment from 'moment';
import { Inject } from 'util/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
import { remote } from 'electron';
import { $t } from 'services/i18n';

@Component({})
export default class TopNav extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;

  get hasProgram(): boolean {
    return this.nicoliveProgramService.hasProgram;
  }

  get programID(): string {
    return this.nicoliveProgramService.state.programID;
  }

  get programStatus() { // 推論させる
    return this.nicoliveProgramService.state.status;
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

  private twitterShareContent(): { text: string, url: string } {
    const title = this.nicoliveProgramService.state.title;
    const url = `https://live2.nicovideo.jp/watch/${this.programID}?ref=sharetw`;
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

  openInDefaultBrowser(event: MouseEvent): void {
    const href = (event.currentTarget as HTMLAnchorElement).href;
    const url = new URL(href);
    if (/^https?/.test(url.protocol)) {
      remote.shell.openExternal(url.toString());
    }
  }

  isFetching: boolean = false;
  async fetchProgram() {
    try {
      this.isFetching = true;
      return await this.nicoliveProgramService.fetchProgram();
    } catch (e) {
      console.warn(e);
      // TODO: 翻訳
      // TODO: エラー理由を見て出し分ける
      await new Promise(resolve => {
        remote.dialog.showMessageBox(
          remote.getCurrentWindow(),
          {
            type: 'warning',
            message: 'ニコニコ生放送にて番組が作成されていません。\n［番組作成］ボタンより、番組を作成してください。',
            buttons: [$t('common.ok')],
            noLink: true,
          },
          done => resolve(done)
        );
      });
    } finally {
      this.isFetching = false;
    }
  }

  isEditing: boolean = false;
  async editProgram() {
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
}
