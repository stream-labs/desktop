import Vue from 'vue';
import { Inject } from 'services/core/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';

export default class BottomLine extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;

  get isOnAir(): boolean {
    return this.nicoliveProgramService.state.status === 'onAir';
  }
}
