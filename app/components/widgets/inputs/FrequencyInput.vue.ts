import { Component, Prop } from 'vue-property-decorator';
import { IInputMetadata, IListOption } from '../../shared/inputs';
import ListInput from 'components/shared/inputs/ListInput.vue';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import { $t } from 'services/i18n';

@Component({
  components: { ListInput },
})
export default class FrequencyInput extends BaseInput<string, {}> {
  @Prop()
  readonly value: string;

  @Prop()
  readonly metadata: IInputMetadata;

  @Prop()
  readonly title: string;

  listOptions = [
    { title: $t('Very Rarely'), value: '1' },
    { title: $t('Rarely'), value: '2' },
    { title: $t('As Default'), value: '3' },
    { title: $t('Frequently'), value: '4' },
    { title: $t('Very Frequently'), value: '5' },
  ];

  get listInputMetadata() {
    return {
      ...this.options,
      options: this.listOptions,
    };
  }
}
