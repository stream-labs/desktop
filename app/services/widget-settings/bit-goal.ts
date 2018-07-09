import { GenericGoalService } from './generic-goal';


export class BitGoalService extends GenericGoalService {


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

  getPreviewUrl() {
    return `https://${ this.getHost() }/widgets/bit-goal?token=${this.getWidgetToken()}`;
  }

}
