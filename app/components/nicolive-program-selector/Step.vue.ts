import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({})
export default class Step extends Vue {
  @Prop()
  title: string;

  @Prop()
  description: string;
}
