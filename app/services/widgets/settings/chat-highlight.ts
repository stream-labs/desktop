import uuid from 'uuid/v4';
import { BehaviorSubject } from 'rxjs';
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
import { authorizedHeaders, jfetch } from 'util/requests';
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
  font_family: string;
  message_font_size: number;
  message_font_weight: number;
  message_text_color: string;
  message_background_color: string;
  name_font_size: number;
  name_font_weight: number;
  name_text_color: string;
  name_background_color: string;
}

export interface IChatHighlightData extends IWidgetData {
  settings: IChatHighlightSettings;
}

@InheritMutations()
export class ChatHighlightService extends WidgetSettingsService<IChatHighlightData> {
  static initialState = WIDGET_INITIAL_STATE;

  // Hack to introduce arbitrary state value to WidgetSettings
  hasPinnedMessage = new BehaviorSubject(false);

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
    messageData.messageToPin.tags.id = uuid();
    const request = new Request(url, {
      headers,
      method: 'POST',
      body: JSON.stringify(messageData),
    });
    fetch(request).then(resp => {
      if (resp.ok && this.state.data.settings.highlight_duration === 0) {
        this.hasPinnedMessage.next(true);
      }
    });
  }

  async unpinMessage() {
    const headers = authorizedHeaders(this.getWidgetToken());
    headers.append('Content-Type', 'application/json');
    const url = `https://${this.getHost()}/api/v5/slobs/widget/chat-highlight/clear-pin`;
    const request = new Request(url, {
      headers,
      method: 'POST',
    });
    fetch(request).then(resp => {
      if (resp.ok) this.hasPinnedMessage.next(false);
    });
  }

  async getCurrentPin() {
    const headers = authorizedHeaders(this.getWidgetToken());
    headers.append('Content-Type', 'application/json');
    const url = `https://${this.getHost()}/api/v5/slobs/widget/chat-highlight/get-existing-pin`;
    const request = new Request(url, {
      headers,
    });
    jfetch<IChatHighlightMessage>(request).then(message => {
      if (message && this.state.data.settings.highlight_duration === 0) {
        this.hasPinnedMessage.next(true);
      }
    });
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
      fontFamily: metadata.fontFamily({ title: $t('Font Family') }),
      messageFontSize: metadata.slider({
        title: $t('Message Font Size'),
        min: 12,
        max: 48,
        interval: 2,
      }),
      messageFontWeight: metadata.slider({
        title: $t('Message Font Weight'),
        interval: 100,
        min: 300,
        max: 900,
      }),
      messageTextColor: metadata.color({ title: $t('Message Text Color') }),
      messageBackgroundColor: metadata.color({ title: $t('Message Background Color') }),
      nameFontSize: metadata.slider({
        title: $t('Name Font Size'),
        min: 12,
        max: 48,
        interval: 2,
      }),
      nameFontWeight: metadata.slider({
        title: $t('Name Font Weight'),
        interval: 100,
        min: 300,
        max: 900,
      }),
      nameTextColor: metadata.color({ title: $t('Name Text Color') }),
      nameBackgroundColor: metadata.color({ title: $t('Name Background Color') }),
    });
  }
}
