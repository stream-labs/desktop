import { Component, Prop, Watch } from 'vue-property-decorator';
import {
  MediaShareService,
  IMediaShareData,
  IMediaShareBan,
} from 'services/widgets/settings/media-share';
import { Inject } from '../../util/injector';

import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';

import { inputComponents } from './inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';

import { $t } from 'services/i18n';
import { ChatbotCommonService } from 'services/chatbot';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    ValidatedForm,
    ...inputComponents,
  },
})
export default class MediaShare extends WidgetSettings<IMediaShareData, MediaShareService> {
  @Inject() chatbotCommonService: ChatbotCommonService;

  openBlacklist() {
    this.chatbotCommonService.openSongRequestPreferencesWindow();
  }

  pricePerSecTooltip = $t(
    'In order to control length, you can decide how much it costs per second to share media. Setting this to 0.30' +
      ' would mean that for $10, media would play for 30 seconds. The default value is 0.10.',
  );

  minAmountTooltip = $t(
    'The minimum amount a donor must donate in order to share media. The default value is $5.00 USD',
  );

  maxDurationTooltip = $t(
    'The maximum duration in seconds that media can be played, regardless of amount donated.' +
      ' The default value is 60 seconds.',
  );

  bufferTimeTooltip = $t('The time between videos the next video has to buffer.');

  securityDescription = $t(
    // tslint:disable-next-line:prefer-template
    'This slider helps you filter shared media before it can be submitted.\n' +
      'Off: No security\n' +
      'Low: 65%+ rating, 5k+ views\n' +
      'Medium: 75%+ rating, 40k+ views\n' +
      'High: 80%+ rating, 300k+ views\n' +
      'Very High: 85%+ rating, 900k+ views',
  );

  bufferMeta = { tooltip: this.bufferTimeTooltip, max: 30, interval: 1 };

  navItems = [
    { value: 'media', label: $t('Manage Media Settings') },
    { value: 'source', label: $t('Source') },
  ];
}
