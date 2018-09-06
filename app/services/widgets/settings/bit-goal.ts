import { GenericGoalService } from './generic-goal';
import { WidgetType } from 'services/widgets/index';
import { CODE_EDITOR_WITH_CUSTOM_FIELDS_TABS } from './widget-settings';


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
    },
    ...CODE_EDITOR_WITH_CUSTOM_FIELDS_TABS
  ];

  getVersion() {
    return 5;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/bitgoal/settings`;
  }

  getPreviewUrl() {
    return `https://${ this.getHost() }/widgets/bit-goal?token=${this.getWidgetToken()}`;
  }

}
