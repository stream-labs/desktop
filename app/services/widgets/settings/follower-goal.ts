import { GenericGoalService } from './generic-goal';
import { WidgetType } from 'services/widgets/index';
import { CODE_EDITOR_WITH_CUSTOM_FIELDS_TABS } from 'services/widgets/settings/widget-settings';


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
    },

    ...CODE_EDITOR_WITH_CUSTOM_FIELDS_TABS
  ];

  getVersion() {
    return 5;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/followergoal/settings`;
  }

  getPreviewUrl() {
    return `https://${ this.getHost() }/widgets/bit-goal?token=${this.getWidgetToken()}`;
  }

}
