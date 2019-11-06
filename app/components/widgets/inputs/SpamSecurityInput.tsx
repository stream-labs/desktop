import { Component, Prop } from 'vue-property-decorator';
import { Slider } from 'streamlabs-beaker';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import { ISpamSecurityMetadata } from 'components/widgets/inputs/index';
import { $t } from 'services/i18n';

@Component({})
export default class SpamSecurityInput extends BaseInput<number, ISpamSecurityMetadata> {
  @Prop() readonly value: number;
  @Prop() readonly metadata: ISpamSecurityMetadata;
  @Prop() readonly title: string;

  idxMod = this.metadata.indexModifier || 0;

  localValue = this.optionData[this.value - this.idxMod];

  get optionData() {
    if (this.metadata.data) return this.metadata.data;
    return [$t('Off'), $t('Low'), $t('Medium'), $t('High'), $t('Very High')];
  }

  updateLocalValue(value: string) {
    this.localValue = value;
    this.emitInput(this.optionData.indexOf(value) + this.idxMod);
  }

  render() {
    return (
      <Slider
        value={this.localValue}
        onInput={(value: string) => this.updateLocalValue(value)}
        speed={0}
        data={this.optionData}
      />
    );
  }
}
