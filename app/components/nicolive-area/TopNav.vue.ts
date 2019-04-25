import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveProgramService, NicoliveProgramServiceFailure } from 'services/nicolive-program/nicolive-program';

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
      if (caught instanceof NicoliveProgramServiceFailure) {
        await NicoliveProgramService.openErrorDialogFromFailure(caught);
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
}
