import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import Popper from 'vue-popperjs';

import { Inject } from 'services/core/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';

interface IArea {
  name: string;
  slotName: string;
  defaultSelected?: boolean;
}

@Component({
  components: { Popper },
})
export default class AreaSwitcher extends Vue {
  @Prop()
  contents: IArea[];

  @Inject()
  private nicoliveProgramService: NicoliveProgramService;

  get compactMode(): boolean {
    return this.nicoliveProgramService.state.isCompact;
  }

  activeContent: IArea = this.contents.find(c => c.defaultSelected) ?? this.contents[0];

  select(slotName: string) {
    this.activeContent = this.contents.find(c => c.slotName === slotName)!;
  }
}
