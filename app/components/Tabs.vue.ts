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

  @Prop()
  value: string;

  showTab(tab: string) {
    this.$emit('input', tab);
  }

  mounted() {
    if (!this.value) this.showTab(this.tabs[0].value);
  }
}
