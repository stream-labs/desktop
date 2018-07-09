import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';
import { fonts } from '../../../services/widget-settings/fonts';
import { WInput } from './WInput';
import { $t } from 'services/i18n';

@Component({
  components: { Multiselect }
})
export default class WFontFamilyInput extends WInput<string, void> {
  @Prop() value: string;

  tooltipText = $t(
    'The Google Font to use for the text. Visit http://google.com/fonts to find one! Popular Fonts include: Open Sans, Roboto, Oswald, Lato, and Droid Sans.'
  );

  fonts = fonts;
}
