import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';

@Component({})
export default class ProgramDescription extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;

  get programDescription(): string {
    return this.nicoliveProgramService.state.description;
  }
}
