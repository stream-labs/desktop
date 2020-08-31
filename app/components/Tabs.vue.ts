import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import Scrollable from './shared/Scrollable';

export interface ITab {
  name: string;
  value: string;
}

@Component({ components: { Scrollable } })
export default class Tabs extends Vue {
  @Prop() tabs: ITab[];
  @Prop() value: string;
  @Prop() className: string;
  @Prop() hideContent: boolean;

  showTab(tab: string) {
    this.$emit('input', tab);
  }

  mounted() {
    if (!this.value) this.showTab(this.tabs[0].value);
  }
}
