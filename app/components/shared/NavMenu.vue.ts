import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({})
export default class NavMenu extends Vue {

  @Prop()
  value: string;

  setValue(value: string) {
    this.$emit('input', value);
  }

}
