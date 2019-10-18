import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

export interface ITab {
  name: string;
  value: string;
}

@Component({})
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
