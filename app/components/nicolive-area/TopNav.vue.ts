import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
import { clipboard } from 'electron';
import {
  NicoliveFailure,
  openErrorDialogFromFailure,
} from 'services/nicolive-program/NicoliveFailure';

@Component({})
export default class TopNav extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;

  get hasProgram(): boolean {
    return this.nicoliveProgramService.hasProgram;
  }

  isFetching: boolean = false;
  async fetchProgram(): Promise<void> {
    if (this.isFetching) throw new Error('fetchProgram is running');
    try {
      this.isFetching = true;
      await this.nicoliveProgramService.fetchProgram();
    } catch (caught) {
      if (caught instanceof NicoliveFailure) {
        await openErrorDialogFromFailure(caught);
      } else {
        throw caught;
      }
    } finally {
      this.isFetching = false;
    }
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

  hasProgramUrlCopied: boolean = false;
  clearTimer: number = 0;
  copyProgramURL() {
    if (this.isFetching) throw new Error('fetchProgram is running');
    clipboard.writeText(
      `https://live.nicovideo.jp/watch/${this.nicoliveProgramService.state.programID}`,
    );
    this.hasProgramUrlCopied = true;
    window.clearTimeout(this.clearTimer);

    this.clearTimer = window.setTimeout(() => {
      this.hasProgramUrlCopied = false;
      this.clearTimer = null;
    }, 1000);
  }
}
