import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({})
export default class NavMenu extends Vue {

  @Prop()
  value: string;

  @Prop({ default: false })
  isChild: boolean;

  mounted() {
    debugger;
  }

  setValue(value: string) {
    this.$emit('input', value);
  }

}
