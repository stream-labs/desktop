import { GenericGoalService } from './generic-goal';
import { WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/stateful-service';

@InheritMutations()
export class DonationGoalService extends GenericGoalService {
  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.DonationGoal,
      url: `https://${this.getHost()}/widgets/donation-goal?token=${this.getWidgetToken()}`,
      previewUrl: `https://${this.getHost()}/widgets/donation-goal?token=${this.getWidgetToken()}`,
      dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/donationgoal/settings`,
      settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/donationgoal/settings`,
      goalUrl: `https://${this.getHost()}/api/v5/slobs/widget/donationgoal`,
      settingsUpdateEvent: 'donationGoalSettingsUpdate',
      goalCreateEvent: 'donationGoalStart',
      goalResetEvent: 'donationGoalEnd',
      hasTestButtons: true,
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }
}
