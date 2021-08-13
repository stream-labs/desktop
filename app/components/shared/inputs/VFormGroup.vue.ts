import { Component, Prop } from 'vue-property-decorator';
import { EInputType, IInputMetadata } from './index';
import FormInput from './FormInput.vue';
import BaseFormGroup from './BaseFormGroup';

@Component({
  components: { FormInput },
})
export default class VFormGroup extends BaseFormGroup {
  @Prop()
  type: EInputType;

  @Prop()
  value: undefined;

  @Prop()
  metadata: IInputMetadata;

  @Prop()
  title: string;
}
