import { Component, Prop } from 'vue-property-decorator';
import { EInputType, IInputMetadata } from './index';
import FormInput from './FormInput.vue';
import BaseFormGroup from './BaseFormGroup';

@Component({
  components: { FormInput },
})
export default class VFormGroup extends BaseFormGroup {
  @Prop()
  readonly type: EInputType;

  @Prop()
  readonly value: undefined;

  @Prop({ default: () => ({}) })
  readonly metadata: IInputMetadata;

  @Prop()
  readonly title: string;

  @Prop()
  readonly name: string;

  created() {
    super.created();
  }
}
