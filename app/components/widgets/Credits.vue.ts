import { Component } from 'vue-property-decorator';
import { CreditsService, ICreditsData } from 'services/widgets/settings/credits';

import { inputComponents } from 'components/widgets/inputs';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n/index';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    ValidatedForm,
    ...inputComponents,
  },
})
export default class Credits extends WidgetSettings<ICreditsData, CreditsService> {
  get themeMetadata() {
    return Object.keys(this.wData.themes).map(theme => ({
      title: this.wData.themes[theme].label,
      value: theme,
    }));
  }

  rollCredits() {
    this.service.testRollCredits();
  }

  textColorTooltip = $t('A hex code for the base text color.');
  delayTimeTooltip = $t('Wait time before rerunning the credit reel.');
  rollSpeedTooltip = $t('Speed of the rolling credits.');
  rollTimeTooltip = $t('Duration of the rolling credits.');
  creditsSubtitleTooltip =
    $t('When the credits roll, this will be the format of the subtitle. Available tokens:') +
    ' {total_donated_amount}, {total_cheer_amount}, {top_donor}, {top_donated_amount}, {top_cheer_donor}, {username},' +
    ' {top_cheer_amount}, {new_subscriber_count}, {new_follower_count}.';

  navItems = [
    { value: 'manage-credits', label: $t('Manage Credits') },
    { value: 'visual', label: $t('Visual Settings') },
    { value: 'source', label: $t('Source') },
  ];
}
