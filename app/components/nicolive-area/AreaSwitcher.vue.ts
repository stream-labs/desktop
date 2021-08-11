import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import Popper from 'vue-popperjs';

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

  activeContent: IArea = this.contents.find(c => c.defaultSelected) ?? this.contents[0];

  select(slotName: string) {
    this.activeContent = this.contents.find(c => c.slotName === slotName)!;
  }
}
