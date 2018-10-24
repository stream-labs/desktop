import { Component, Prop } from 'vue-property-decorator';
import { EInputType, IInputMetadata } from './index';
import FormInput from './FormInput.vue';
import BaseFormGroup from './BaseFormGroup';

/**
 * Horizontal layout for input-component
 */
@Component({
  components: { FormInput }
})
export default class HFormGroup extends BaseFormGroup {

  @Prop()
  readonly type: EInputType;

  @Prop()
  readonly value: undefined;

  @Prop()
  readonly metadata: IInputMetadata;

  @Prop()
  readonly title: string;

  created() {
    super.created();
  }

}
