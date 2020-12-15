import { GenericGoalService } from './generic-goal';
import { WidgetDefinitions, WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';

@InheritMutations()
export class CharityGoalService extends GenericGoalService {
  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.BitGoal,
      url: WidgetDefinitions[WidgetType.BitGoal].url(this.getHost(), this.getWidgetToken()),
      dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/streamlabscharitydonationgoal/settings`,
      previewUrl: `https://${this.getHost()}/widgets/streamlabscharitydonation-goal?token=${this.getWidgetToken()}`,
      settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/streamlabscharitydonationgoal/settings`,
      goalUrl: `https://${this.getHost()}/api/v5/slobs/widget/streamlabscharitydonationgoal`,
      settingsUpdateEvent: 'streamlabsCharityDonationGoalSettingsUpdate',
      hasTestButtons: true,
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }
}
