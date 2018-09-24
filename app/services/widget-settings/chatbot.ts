import { IWidgetData, IWidgetSettings, WidgetSettingsService } from './widget-settings';
import { WidgetType } from 'services/widgets';
import { clone } from 'lodash';
import { $t } from 'services/i18n';

export interface IMediaShareData extends IWidgetData {
}

export class ChatbotService extends WidgetSettingsService<IMediaShareData> {

  getWidgetType() {
    return WidgetType.MediaShare;
  }

  getVersion() {
    return 5;
  }

  getPreviewUrl() {
    alert('got preview url');
    return `https://${ this.getHost() }/widgets/chatbot/v1/${this.getWidgetToken()}?simulate=1`;
  }

  getDataUrl() {
    alert('getting data. shouldnt come here');
    return `https://${this.getHost()}/api/v${this.getVersion()}/slobs/widget/media`;
  }

  protected tabs: any[] = [
    // { name: 'settings', title: $t('Settings') },
    // { name: 'banned_media', title: $t('Banned Media') },
  ];

}
