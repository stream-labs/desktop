import { Component } from 'vue-property-decorator';
import { IChatHighlightData, ChatHighlightService } from 'services/widgets/settings/chat-highlight';

import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';

import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';

import { $t } from 'services/i18n';

@Component({})
export default class ChatHighlight extends WidgetSettings<
  IChatHighlightData,
  ChatHighlightService
> {
  get metadata() {
    return this.service.getMetadata();
  }

  get navItems() {
    return [
      { value: 'highlight', label: $t('Highlight Settings') },
      { value: 'message', label: $t('Message Settings') },
      { value: 'name', label: $t('Name Settings') },
      { value: 'source', label: $t('Source') },
    ];
  }

  render() {
    return (
      this.wData && (
        <WidgetEditor navItems={this.navItems}>
          <ValidatedForm slot="highlight-properties" key="highlight" onInput={() => this.save()}>
            <span style="margin-bottom: 16px; display: block;">
              {$t(
                'Use this widget by hovering over the right side of a chat message to see a thumbtack icon. Clicking the icon will pin the message to the widget for its duration, or until you click the unpin button.',
              )}
            </span>
            <VFormGroup
              vModel={this.wData.settings.highlight_duration}
              metadata={this.metadata.duration}
            />
            <VFormGroup
              vModel={this.wData.settings.font_family}
              metadata={this.metadata.fontFamily}
            />
          </ValidatedForm>
          <ValidatedForm slot="message-properties" key="message" onInput={() => this.save()}>
            <VFormGroup
              vModel={this.wData.settings.message_font_size}
              metadata={this.metadata.messageFontSize}
            />
            <VFormGroup
              vModel={this.wData.settings.message_font_weight}
              metadata={this.metadata.messageFontWeight}
            />
            <VFormGroup
              vModel={this.wData.settings.message_text_color}
              metadata={this.metadata.messageTextColor}
            />
            <VFormGroup
              vModel={this.wData.settings.message_background_color}
              metadata={this.metadata.messageBackgroundColor}
            />
          </ValidatedForm>
          <ValidatedForm slot="name-properties" key="name" onInput={() => this.save()}>
            <VFormGroup
              vModel={this.wData.settings.name_font_size}
              metadata={this.metadata.nameFontSize}
            />
            <VFormGroup
              vModel={this.wData.settings.name_font_weight}
              metadata={this.metadata.nameFontWeight}
            />
            <VFormGroup
              vModel={this.wData.settings.name_text_color}
              metadata={this.metadata.nameTextColor}
            />
            <VFormGroup
              vModel={this.wData.settings.name_background_color}
              metadata={this.metadata.nameBackgroundColor}
            />
          </ValidatedForm>
        </WidgetEditor>
      )
    );
  }
}
