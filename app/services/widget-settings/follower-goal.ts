import { GenericGoalService } from './generic-goal';
import { WidgetType } from 'services/widgets';


export class FollowerGoalService extends GenericGoalService {

  getWidgetType() {
    return WidgetType.FollowerGoal;
  }

  protected tabs = [
    {
      name: 'goal',
      saveUrl: `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/followergoal`,
      autosave: false
    },
    {
      name: 'settings',
    }
  ];

  getVersion() {
    return 5;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/followergoal/settings`;
  }

  getWidgetUrl() {
    return `https://${ this.getHost() }/widgets/bit-goal?token=${this.getWidgetToken()}`;
  }

}
