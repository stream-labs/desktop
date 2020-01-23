import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveProgramService, NicoliveProgramServiceFailure } from 'services/nicolive-program/nicolive-program';
import { remote } from 'electron';
import { $t } from 'services/i18n';

import ProgramDescription from './ProgramDescription.vue';
import CommentViewer from './CommentViewer.vue';
import CommentFilter from './CommentFilter.vue';
import ProgramInfo from './ProgramInfo.vue';
import ProgramStatistics from './ProgramStatistics.vue';
import ToolBar from './ToolBar.vue';
import TopNav from './TopNav.vue';
import ControlsArrow from '../../../media/images/controls-arrow-vertical.svg';
import AreaSwitcher from './AreaSwitcher.vue';

@Component({
  components: {
    AreaSwitcher,
    TopNav,
    ProgramInfo,
    ProgramDescription,
    CommentViewer,
    CommentFilter,
    ProgramStatistics,
    ToolBar,
    ControlsArrow,
  },
})
export default class NicolivePanelRoot extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;

  get contents() {
    return [
      {
        name: 'コメント',
        text: 'コメント閲覧機能の説明文',
        slotName: 'commentViewer'
      },
      {
        name: '番組詳細',
        text: '番組詳細機能の説明文',
        slotName: 'description'
      },
    ]
  }

  get opened(): boolean {
    return this.nicoliveProgramService.state.panelOpened;
  }

  onToggle(): void {
    this.nicoliveProgramService.togglePanelOpened();
  }

  isCreating: boolean = false;
  async createProgram(): Promise<void> {
    if (this.isCreating) throw new Error('createProgram is running');
    try {
      this.isCreating = true;
      await this.nicoliveProgramService.createProgram();
    } catch (e) {
      console.error(e);
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
    } catch (caught) {
      if (caught instanceof NicoliveProgramServiceFailure) {
        await NicoliveProgramService.openErrorDialogFromFailure(caught);
      } else {
        throw caught;
      }
    } finally {
      this.isFetching = false;
    }
  }

  get hasProgram(): boolean {
    return this.nicoliveProgramService.hasProgram;
  }

}
