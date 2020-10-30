import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({})
export default class DropdownMenu extends Vue {
  @Prop()
  title: string;

  visible = true;

  onToggleVisibleHandler() {
    this.visible = !this.visible;
  }
}
