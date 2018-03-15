import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({})
export default class AddSourceInfo extends Vue {

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({ default: true })
  showSupport: boolean;

}
