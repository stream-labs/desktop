import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
import { remote } from 'electron';
import { $t } from 'services/i18n';

import CommentForm from './CommentForm.vue';
import ProgramDescription from './ProgramDescription.vue';
import ProgramInfo from './ProgramInfo.vue';
import ProgramStatistics from './ProgramStatistics.vue';
import ToolBar from './ToolBar.vue';
import TopNav from './TopNav.vue';
const ControlsArrow = require('../../../media/images/controls-arrow-vertical.svg');

@Component({
  components: {
    TopNav,
    ProgramInfo,
    ProgramDescription,
    ProgramStatistics,
    ToolBar,
    CommentForm,
    ControlsArrow,
  },
})
export default class NicolivePanelRoot extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;

  get opened(): boolean {
    return this.nicoliveProgramService.state.panelOpened;
  }

  onToggle(): void {
    this.nicoliveProgramService.updatePanelOpened(!this.opened);
  }

  isCreating: boolean = false;
  async createProgram(): Promise<void> {
    if (this.isCreating) throw new Error('createProgram is running');
    try {
      this.isCreating = true;
      await this.nicoliveProgramService.createProgram();
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isCreating = false;
    }
  }

  isFetching: boolean = false;
  async fetchProgram(): Promise<void> {
    if (this.isFetching) throw new Error('fetchProgram is running');
    try {
      this.isFetching = true;
      await this.nicoliveProgramService.fetchProgram();
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

  get hasProgram(): boolean {
    return this.nicoliveProgramService.hasProgram;
  }
}
