import { GenericGoalService } from './generic-goal';
import { THttpMethod } from './widget-settings';


export class DonationGoalService extends GenericGoalService {

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
    }
  ];

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
