import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
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
}
