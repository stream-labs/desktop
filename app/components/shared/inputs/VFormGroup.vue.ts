import { Component, Prop } from 'vue-property-decorator';
import { EInputType, IInputMetadata } from './index';
import { BaseInput } from './BaseInput';
import FormInput from './FormInput.vue';


@Component({
  components: { FormInput }
})

export default class VFormGroup extends BaseInput<any, IInputMetadata> {

  @Prop()
  type: EInputType;

  @Prop()
  value: undefined;

  @Prop()
  metadata: IInputMetadata;

  @Prop()
  title: string;

  get formInputMetadata() {
    const options = this.options;
    if (!options.type) return {};
    const inputMetadata = options;

    // VFormGroup handle the render of the FormInput title
    // so remove the title from FormInput metadata
    delete inputMetadata.title;
    delete inputMetadata.tooltip;
    return inputMetadata;
  }

  getOptions() {
    const options = super.getOptions();
    options.type = this.type || options.type;
    options.title = this.title || options.title;
    return options;
  }

}
