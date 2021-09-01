import {
  IWidgetData,
  IWidgetSettings,
  WidgetDefinitions,
  WidgetSettingsService,
  WidgetType,
} from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';
import { formMetadata, metadata } from 'components/shared/inputs';
import { authorizedHeaders } from 'util/requests';
import { $t } from 'services/i18n';

export interface IChatHighlightMessage {
  messageToPin: {
    tags: {
      badges: string;
      color: string;
      'display-name': string;
      emotes: string;
      id: string;
      'user-type': string;
    };
    prefix: string;
    command: string;
    params: string[];
    crlf: string;
  };
}

export interface IChatHighlightSettings extends IWidgetSettings {
  enabled: boolean;
  highlight_duration: number; // milliseconds
}

export interface IChatHighlightData extends IWidgetData {
  settings: IChatHighlightSettings;
}

@InheritMutations()
export class ChatHighlightService extends WidgetSettingsService<IChatHighlightData> {
  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.ChatHighlight,
      url: WidgetDefinitions[WidgetType.ChatHighlight].url(this.getHost(), this.getWidgetToken()),
      previewUrl: `https://${this.getHost()}/widgets/chat-highlight?token=${this.getWidgetToken()}`,
      dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/chat-highlight`,
      settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/chat-highlight`,
      settingsUpdateEvent: 'chatHighlightSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }

  async pinMessage(messageData: IChatHighlightMessage) {
    const headers = authorizedHeaders(this.getWidgetToken());
    headers.append('Content-Type', 'application/json');
    const url = `https://${this.getHost()}/api/v5/slobs/widget/chat-highlight/pin`;
    const request = new Request(url, {
      headers,
      method: 'POST',
      body: JSON.stringify(messageData),
    });
    fetch(request);
  }

  patchAfterFetch(data: IChatHighlightData) {
    data.settings.highlight_duration = data.settings.highlight_duration / 1000;
    return data;
  }

  patchBeforeSend(settings: IChatHighlightSettings) {
    settings.highlight_duration = settings.highlight_duration * 1000;
    return settings;
  }

  getMetadata() {
    return formMetadata({
      enabled: metadata.toggle({ title: $t('Enabled') }),
      duration: metadata.slider({ title: $t('Duration') }),
    });
  }
}
