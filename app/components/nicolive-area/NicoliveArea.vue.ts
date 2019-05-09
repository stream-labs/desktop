import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveProgramService, NicoliveProgramServiceFailure } from 'services/nicolive-program/nicolive-program';
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
