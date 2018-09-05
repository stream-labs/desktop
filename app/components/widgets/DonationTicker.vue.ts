import { Component } from 'vue-property-decorator';
import {
  DonationTickerService,
  IDonationTickerData
} from 'services/widget-settings/donation-ticker';

import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import { inputComponents } from 'components/shared/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';
import CodeEditor from './CodeEditor.vue';
import TestButtons from './TestButtons.vue';

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    CodeEditor,
    TestButtons,
    ...inputComponents
  }
})
export default class DonationTicker extends WidgetSettings<IDonationTickerData, DonationTickerService> {
  messageFormatTooltip = $t(
    'Each donation that shows in the donation ticker will be in this format. Available tokens:'
  ) + ' {name} ' + $t('The name of the donator,') + ' {amount} ' + $t('The amount that was donated');

  maxDonationsTooltip = $t('The maximum amount of donations to show in the ticker. Must be a number greater than 0.');

  scrollSpeedTooltip = $t(
    'How fast the ticker should scroll between 1 (fastest) and 10 (slowest). Set to 0 for no scrolling.'
  );

  backgroundColorTooltip = $t(
    'A hex code for the widget background. This is for preview purposes only. It will not be shown in your stream.'
  );

  fontSizeTooltip = $t('The font size in pixels. Reasonable size typically ranges between 24px and 48px.');

  fontWeightTooltip = $t(
    'How thick to make the font. The value should range between 300 (thinnest) and 900 (thickest)'
  );

  textColorTooltip = $t('A hex code for the base text color.');
  nameColorTooltip = $t('A hex color for the text of the') + ' {name} ' + $t('token');
  amountColorTooltip = $t('A hex color for the text of the') + ' {amount} ' + $t('token');

  settings = [
    { value: 'manage-list', label: $t('Manage List') },
    { value: 'font', label: $t('Font Settings') },
    { value: 'source', label: $t('Source') }
  ];
}