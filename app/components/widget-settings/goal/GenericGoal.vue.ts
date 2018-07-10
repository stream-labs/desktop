import { Component } from 'vue-property-decorator';
import {
  GenericGoalService,
  IGoalData
} from 'services/widget-settings/generic-goal';
import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from 'components/widget-settings/WidgetSettings.vue';

import * as comps from 'components/shared/widget-inputs';
import WFormGroup from 'components/shared/widget-inputs/WFormGroup.vue';
import { $t } from 'services/i18n';

interface IGoalCreateOptions {
  title: string;
  goal_amount: number;
  manual_goal_amount: number;
  ends_at: string;
}

@Component({
  components: {
    WidgetWindow,
    WFormGroup,
    ...comps
  }
})
export default class GenericGoal extends WidgetSettings<IGoalData, GenericGoalService> {

  goalCreateOptions = {
    title: '',
    goal_amount: 100,
    manual_goal_amount: 0,
    ends_at: ''
  };

  textColorTooltip = $t('A hex code for the base text color.');

  get hasGoal() {
    return this.wData.goal && this.wData.goal.title;
  }

  async saveGoal() {
    await this.save(this.goalCreateOptions);
  }

}
