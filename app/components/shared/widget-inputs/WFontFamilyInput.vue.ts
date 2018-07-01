import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';
import { fonts } from '../../../services/widget-settings/fonts';
import { WInput } from './WInput';

@Component({
  components: { Multiselect }
})
export default class WFontFamilyInput extends WInput<string, void> {

  @Prop()
  value: string;

  fonts = fonts;
}
