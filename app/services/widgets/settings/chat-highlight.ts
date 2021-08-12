import {
  IWidgetData,
  IWidgetSettings,
  WidgetDefinitions,
  WidgetSettingsService,
  WidgetType,
} from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';

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

  patchAfterFetch(data: IChatHighlightData) {
    data.settings.highlight_duration = data.settings.highlight_duration / 1000;
    return data;
  }

  patchBeforeSend(settings: IChatHighlightSettings) {
    settings.highlight_duration = settings.highlight_duration * 1000;
    return settings;
  }
}
