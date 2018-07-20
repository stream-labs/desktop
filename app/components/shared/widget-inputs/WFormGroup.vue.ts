import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';
import * as comps from 'components/shared/widget-inputs';
import { EWInputType, IWInputMetadata, WInput } from './WInput';



@Component({
  components: { ...comps }
})

export default class WFormGroup extends WInput<any, IWInputMetadata> {

  @Prop()
  type: EWInputType;

  @Prop()
  value: undefined;

  @Prop({ default: () => {} })
  metadata: Dictionary<any>;

  @Prop()
  title: string;

  get componentName() {
    const type = this.options.type;
    return 'W' + type.charAt(0).toUpperCase() + type.substr(1) + 'Input';
  }

  getOptions() {
    const options = super.getOptions();
    options.type = this.type || options.type;
    options.title = this.title || options.title;
    return options;
  }

}
