import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

interface ITab {
  name: string;
  value: string;
  selected: boolean;
}

@Component({})
export default class Tabs extends Vue {

  @Prop()
  tabs: ITab[];

  selected: string = this.tabs[0].value || '';

  showTab(tab: string) {
    this.selected = tab;
  }

}
