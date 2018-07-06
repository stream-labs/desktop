import { Component } from 'vue-property-decorator';
import {
  GenericGoalService,
  IGoalData
} from 'services/widget-settings/generic-goal';
import WidgetLayout from 'components/windows/WidgetLayout.vue';
import WidgetSettings from 'components/widget-settings/WidgetSettings.vue';

import * as comps from 'components/shared/widget-inputs';
import WFormGroup from 'components/shared/widget-inputs/WFormGroup.vue';
import { $t } from 'services/i18n';

@Component({
  components: {
    WidgetLayout,
    WFormGroup,
    ...comps
  }
})
export default class GenericGoal extends WidgetSettings<IGoalData, GenericGoalService> {

  hasGoal: boolean = false;

  textColorTooltip = $t('A hex code for the base text color.');

  afterFetch() {
    this.hasGoal = !!this.wData.goal;
    if (!this.hasGoal && this.loadingState === 'success') this.wData.goal = {
      title: '',
      goal_amount: 100,
      manual_goal_amount: 0,
      ends_at: ''
    };
  }

}
