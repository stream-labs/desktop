import { GenericGoalService } from './generic-goal';
import { WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/stateful-service';

@InheritMutations()
export class SubGoalService extends GenericGoalService {
  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.SubGoal,
      url: `https://${this.getHost()}/widgets/sub-goal?token=${this.getWidgetToken()}`,
      dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/subgoal/settings`,
      previewUrl: `https://${this.getHost()}/widgets/sub-goal?token=${this.getWidgetToken()}`,
      settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/subgoal/settings`,
      goalUrl: `https://${this.getHost()}/api/v5/slobs/widget/subgoal`,
      settingsUpdateEvent: 'subGoalSettingsUpdate',
      goalCreateEvent: 'subGoalStart',
      goalResetEvent: 'subGoalEnd',
      hasTestButtons: true,
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }
}
