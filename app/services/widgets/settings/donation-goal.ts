import { GenericGoalService } from './generic-goal';
import { CODE_EDITOR_WITH_CUSTOM_FIELDS_TABS, THttpMethod } from './widget-settings';
import { WidgetType } from 'services/widgets/index';


export class DonationGoalService extends GenericGoalService {

  getWidgetType() {
    return WidgetType.DonationGoal;
  }

  protected tabs = [
    {
      name: 'goal',
      saveUrl: `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/donation/goal`,
      resetUrl: `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/donation/goal/end`,
      resetMethod: ('POST' as THttpMethod),
      autosave: false
    },
    {
      name: 'settings'
    },

    ...CODE_EDITOR_WITH_CUSTOM_FIELDS_TABS
  ];

  getApiSettings() {
    return {
      settingsUpdatedEvent: 'donationgoalSettingsUpdate',
      settingsSaveUrl: `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/donationgoal`,
      goalUrl: `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/donation/goal`,
      goalResetUrl: `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/donation/goal/end`
    }
  }

  getVersion() {
    return 5;
  }

  getPreviewUrl() {
    return `https://${ this.getHost() }/widgets/donation-goal?token=${this.getWidgetToken()}`;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/donationgoal`;
  }
}
