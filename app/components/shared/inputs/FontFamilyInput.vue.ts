import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';
import { BaseInput } from './BaseInput';
import { $t } from 'services/i18n';
import { IInputMetadata } from './index';

@Component({
  components: { Multiselect }
})
export default class FontFamilyInput extends BaseInput<string, IInputMetadata> {
  @Prop() value: string;

  fonts: string[] = [];
}
