import { IWidgetData, WidgetSettingsService } from '../index';
import { WidgetType } from 'services/widgets';
import { InheritMutations } from '../../core/stateful-service';

export interface IMediaShareData extends IWidgetData {}

@InheritMutations()
export class ChatbotWidgetService extends WidgetSettingsService<IMediaShareData> {
  getApiSettings() {
    return {
      type: WidgetType.MediaShare,
      url: `https://${this.getHost()}/widgets/chatbot?token=${this.getWidgetToken()}`,
      previewUrl: `https://${this.getHost()}/widgets/chatbot?token=${this.getWidgetToken()}`,
      settingsUpdateEvent: 'mediaShareSettingsUpdate',
      goalCreateEvent: 'newmediaShare',
      goalResetEvent: 'mediaShareEnd',
      dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/media`,
      settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/media`,
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }
  getWidgetType() {
    return WidgetType.MediaShare;
  }

  getVersion() {
    return 5;
  }

  getPreviewUrl() {
    alert('got preview url');
    return `https://${this.getHost()}/widgets/chatbot/v1/${this.getWidgetToken()}?simulate=1`;
  }

  getDataUrl() {
    alert('getting data. shouldnt come here');
    return `https://${this.getHost()}/api/v${this.getVersion()}/slobs/widget/media`;
  }
}
