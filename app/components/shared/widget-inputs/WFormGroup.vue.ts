import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';
import * as comps from 'components/shared/widget-inputs';



@Component({
  components: { ...comps }
})

export default class WFormGroup extends Vue {

  @Prop()
  type: string;

  @Prop()
  value: undefined;

  @Prop({ default: () => {} })
  metadata: Dictionary<any>;

  @Prop()
  title: string;

  get componentName() {
    return 'W' + this.type.charAt(0).toUpperCase() + this.type.substr(1) + 'Input';
  }

  get defaultTitle() {
    return {
      text: 'text',
      fontFamily: 'Font'
    }[this.type];
  }

}
