import { Component } from 'vue-property-decorator';
import {
  CreditsService,
  ICreditsData
} from 'services/widgets/settings/credits';

import { inputComponents } from 'components/widgets/inputs';
import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from './WidgetSettings.vue';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { $t } from 'services/i18n/index';
import CodeEditor from './CodeEditor.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

@Component({
  components: {
    WidgetWindow,
    HFormGroup,
    CodeEditor,
    ValidatedForm,
    ...inputComponents
  }
})
export default class Credits extends WidgetSettings<ICreditsData, CreditsService> {
  get themeMetadata() {
    return Object.keys(this.wData.themes).map((theme) => ({
      title: this.wData.themes[theme].label,
      value: theme
    }));
  }

  textColorTooltip = $t('A hex code for the base text color.');
  delayTimeTooltip = $t('Wait time before rerunning the credit reel.');
  rollSpeedTooltip = $t('Speed of the rolling credits.');
  rollTimeTooltip = $t('Duration of the rolling credits.');
  creditsSubtitleTooltip = $t('When the credits roll, this will be the format of the subtitle. Available tokens:') +
    ' {total_donated_amount}, {total_cheer_amount}, {top_donor}, {top_donated_amount}, {top_cheer_donor}, {username},' +
    ' {top_cheer_amount}, {new_subscriber_count}, {new_follower_count}.'
}
