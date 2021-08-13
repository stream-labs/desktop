import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({})
export default class AddSourceInfo extends Vue {
  @Prop()
  sourceType: string;

  @Prop({ default: true, type: Boolean })
  showAttention: boolean;
}
