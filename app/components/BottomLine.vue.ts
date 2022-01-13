import Vue from 'vue';
import { Inject } from 'services/core/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';

export default class BottomLine extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;

  get programStatus(): string {
    return this.nicoliveProgramService.state.status;
  }
}
