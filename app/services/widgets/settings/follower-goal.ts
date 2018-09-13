import { GenericGoalService } from './generic-goal';
import { WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/stateful-service';

@InheritMutations()
export class FollowerGoalService extends GenericGoalService {

  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.FollowerGoal,
      url: `https://${ this.getHost() }/widgets/follower-goal?token=${this.getWidgetToken()}`,
      previewUrl: `https://${ this.getHost() }/widgets/bit-goal?token=${this.getWidgetToken()}`,
      dataFetchUrl: `https://${ this.getHost() }/api/v5/slobs/widget/followergoal/settings`,
      settingsSaveUrl: `https://${ this.getHost() }/api/v5/slobs/widget/followergoal/settings`,
      goalUrl: `https://${ this.getHost() }/api/v5/slobs/widget/followergoal`,
      settingsUpdateEvent: 'followerGoalSettingsUpdate',
      goalCreateEvent: 'followerGoalStart',
      goalResetEvent: 'followerGoalEnd',
      hasTestButtons: true,
      customFieldsAllowed: true
    }
  }

}
