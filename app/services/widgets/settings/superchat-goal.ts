import { GenericGoalService } from './generic-goal';
import { WidgetDefinitions, WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';

@InheritMutations()
export class SuperchatGoalService extends GenericGoalService {
  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.SuperchatGoal,
      url: WidgetDefinitions[WidgetType.SuperchatGoal].url(this.getHost(), this.getWidgetToken()),
      previewUrl: `https://${this.getHost()}/widgets/super-chat-goal?token=${this.getWidgetToken()}`,
      dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/superchatgoal/settings`,
      settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/superchatgoal/settings`,
      goalUrl: `https://${this.getHost()}/api/v5/slobs/widget/superchatgoal`,
      settingsUpdateEvent: 'superChatGoalSettingsUpdate',
      goalCreateEvent: 'superChatGoalStart',
      goalResetEvent: 'superChatGoalEnd',
      hasTestButtons: true,
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }
}
