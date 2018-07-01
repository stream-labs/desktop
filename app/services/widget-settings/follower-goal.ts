import { GenericGoalService } from './generic-goal';


export class FollowerGoalService extends GenericGoalService {


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
