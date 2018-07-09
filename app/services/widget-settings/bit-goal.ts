import { GenericGoalService } from './generic-goal';
import { WidgetType } from 'services/widgets';


export class BitGoalService extends GenericGoalService {

  getWidgetType() {
    return WidgetType.BitGoal;
  }

  protected tabs = [
    {
      name: 'goal',
      saveUrl: `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/bitgoal`,
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
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/bitgoal/settings`;
  }

  getWidgetUrl() {
    return `https://${ this.getHost() }/widgets/bit-goal?token=${this.getWidgetToken()}`;
  }

}
