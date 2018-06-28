import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

export interface ITab {
  name: string;
  value: string;
}

@Component({})
export default class Tabs extends Vue {

  @Prop() tabs: ITab[];

  selected: string = this.tabs[0].value || '';

  showTab(tab: string) {
    this.selected = tab;
  }

}
