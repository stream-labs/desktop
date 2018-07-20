import { Component } from 'vue-property-decorator';
import {
  CreditsService,
  ICreditsData
} from 'services/widget-settings/credits';

import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from './WidgetSettings.vue';

import * as comps from 'components/shared/widget-inputs';
import WFormGroup from 'components/shared/widget-inputs/WFormGroup.vue';
import { $t } from 'services/i18n';

@Component({
  components: {
    WidgetWindow,
    WFormGroup,
    ...comps
  }
})
export default class Credits extends WidgetSettings<ICreditsData, CreditsService> {
  textColorTooltip = $t('A hex code for the base text color.');

  creditSubtitleTooltip = $t(
    'When the credits roll, this will be the format of the subtitle. Available tokens: {total_donated_amount}, {total_cheer_amount}, {top_donor}, {top_donated_amount}, {top_cheer_donor}, {username}, {top_cheer_amount}, {new_subscriber_count}, {new_follower_count}.'
  );
}
