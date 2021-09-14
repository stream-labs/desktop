// import { WidgetDefinitions, WidgetType } from '../../widgets-data';
// import { WidgetSettingsBaseService } from '../widget-settings-base';
//
// export class AlertBoxService extends WidgetSettingsBaseService {
//   getApiSettings() {
//     return {
//       type: WidgetType.AlertBox,
//       url: WidgetDefinitions[WidgetType.AlertBox].url(this.getHost(), this.getWidgetToken()),
//       previewUrl: `https://${this.getHost()}/alert-box/v3/${this.getWidgetToken()}`,
//       dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/alertbox?include_linked_integrations_only=true&primary_only=false`,
//       settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/alertbox`,
//       settingsUpdateEvent: 'filteredAlertBoxSettingsUpdate',
//       customCodeAllowed: true,
//       customFieldsAllowed: true,
//       testers: ['Follow', 'Subscription', 'Donation', 'Bits', 'Host'],
//     };
//   }
// }
