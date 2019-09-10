import { GenericGoalService } from './generic-goal';
import { WidgetDefinitions, WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';

@InheritMutations()
export class SupporterGoalService extends GenericGoalService {
  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.SupporterGoal,
      url: WidgetDefinitions[WidgetType.SupporterGoal].url(this.getHost(), this.getWidgetToken()),
      previewUrl: `https://${this.getHost()}/widgets/supporter-goal?token=${this.getWidgetToken()}`,
      dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/supportergoal/settings`,
      settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/supportergoal/settings`,
      goalUrl: `https://${this.getHost()}/api/v5/slobs/widget/supportergoal`,
      settingsUpdateEvent: 'supporterGoalSettingsUpdate',
      goalCreateEvent: 'supporterGoalStart',
      goalResetEvent: 'supporterGoalEnd',
      hasTestButtons: true,
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }
}
