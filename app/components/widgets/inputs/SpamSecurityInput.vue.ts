import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import { ISpamSecurityMetadata } from 'components/widgets/inputs/index';
import { SliderInput } from 'components/shared/inputs/inputs';
import { $t } from 'services/i18n';

@Component({ components: { SliderInput } })
export default class SpamSecurityInput extends BaseInput<number, ISpamSecurityMetadata> {
  @Prop() readonly value: number;
  @Prop() readonly metadata: ISpamSecurityMetadata;

  idxMod = this.metadata.indexModifier || 0;

  localValue = this.optionData[this.value - this.idxMod];

  get optionData() {
    return [$t('Off'), $t('Low'), $t('Medium'), $t('High'), $t('Very High')];
  }

  get spamMetadata() {
    return {
      data: this.optionData,
      ...this.metadata,
    };
  }

  updateLocalValue(value: string) {
    this.localValue = value;
    this.emitInput(this.optionData.indexOf(value) + this.idxMod);
  }
}
