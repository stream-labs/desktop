import { Component, Prop } from 'vue-property-decorator';
import { IListMetadata } from '../../shared/inputs';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import { Multiselect } from 'vue-multiselect';

@Component({
  components: { Multiselect }
})
export default class SectionedMultiselectInput
  extends BaseInput<string, IListMetadata<{ label: string, options: { value: string, label: string }[] }>> {

  @Prop()
  readonly value: string;

  @Prop()
  readonly metadata: IListMetadata<{ label: string, options: { value: string, label: string }[] }>;

  @Prop()
  readonly title: string;
}
