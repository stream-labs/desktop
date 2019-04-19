import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
import { remote } from 'electron';
import { $t } from 'services/i18n';

@Component({})
export default class ProgramInfo extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;

  programTitleTooltip = this.programTitle;
  communityNameTooltip = this.communityName;

  // TODO: 後でまとめる
  programIsMemberOnlyTooltip = 'コミュニティ限定放送';

  isCreating: boolean = false;
  async createProgram() {
    if (this.isCreating) throw new Error('createProgram is running');
    try {
      this.isCreating = true;
      return await this.nicoliveProgramService.createProgram();
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isCreating = false;
    }
  }

  isFetching: boolean = false;
  async fetchProgram() {
    if (this.isFetching) throw new Error('fetchProgram is running');
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

  isStarting: boolean = false;
  async startProgram() {
    if (this.isStarting) throw new Error('startProgram is running');
    try {
      this.isStarting = true;
      return await this.nicoliveProgramService.startProgram();
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isStarting = false;
    }
  }

  isEnding: boolean = false;
  async endProgram() {
    if (this.isEnding) throw new Error('endProgram is running');
    try {
      this.isEnding = true;
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
          idx => resolve(idx === 0)
        );
      });

      if (isOk) {
        return await this.nicoliveProgramService.endProgram();
      }
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isEnding = false;
    }
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
}
