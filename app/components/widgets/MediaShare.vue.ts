import { Component, Prop, Watch } from 'vue-property-decorator';
import {
  MediaShareService,
  IMediaShareData
} from 'services/widget-settings/media-share';

import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from './WidgetSettings.vue';

import { inputComponents } from './inputs';
import FormGroup from 'components/shared/inputs/FormGroup.vue';
import CodeEditor from './CodeEditor.vue';

import { $t } from 'services/i18n';

@Component({
  components: {
    WidgetWindow,
    FormGroup,
    CodeEditor,
    ...inputComponents
  }
})
export default class MediaShare extends WidgetSettings<IMediaShareData, MediaShareService> {
  pricePerSecTooltip = $t(
    'In order to control length, you can decide how much it costs per second to share media. Setting this to 0.30' +
    ' would mean that for $10, media would play for 30 seconds. The default value is 0.10.'
  );

  minAmountTooltip = $t(
    'The minimum amount a donor must donate in order to share media. The default value is $5.00 USD'
  );

  maxDurationTooltip = $t(
    'The maximum duration in seconds that media can be played, regardless of amount donated.' +
    ' The default value is 60 seconds.'
  );

  bufferTimeTooltip = $t('The time between videos the next video has to buffer.');

  securityDescription = $t(
    'This slider helps you filter shared media before it can be submitted.\n' +
    '1: No security\n' +
    '2: 65%+ rating, 5k+ views\n' +
    '3: 75%+ rating, 40k+ views\n' +
    '4: 80%+ rating, 300k+ views\n' +
    '5: 85%+ rating, 900k+ views'
  );

  securityMeta = { description: this.securityDescription, max: 5, interval: 1 }
  bufferMeta = { tooltip: this.bufferTimeTooltip, max: 30, interval: 1 }
}
