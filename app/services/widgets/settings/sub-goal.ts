import { GenericGoalService } from './generic-goal';
import { WidgetType } from 'services/widgets';
import { CODE_EDITOR_WITH_CUSTOM_FIELDS_TABS } from './widget-settings';


export class SubGoalService extends GenericGoalService {

  getWidgetType() {
    return WidgetType.SubGoal;
  }

  protected tabs = [
    {
      name: 'goal',
      saveUrl: `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/subgoal`,
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
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/subgoal/settings`;
  }

  getPreviewUrl() {
    return `https://${ this.getHost() }/widgets/sub-goal?token=${this.getWidgetToken()}`;
  }

}
