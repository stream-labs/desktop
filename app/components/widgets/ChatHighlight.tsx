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
      { value: 'source', label: $t('Source') },
    ];
  }

  render() {
    return (
      this.wData && (
        <WidgetEditor navItems={this.navItems}>
          <ValidatedForm slot="highlight-properties" onInput={() => this.save()}>
            <VFormGroup vModel={this.wData.settings.enabled} metadata={this.metadata.enabled} />
            <VFormGroup
              vModel={this.wData.settings.highlight_duration}
              metadata={this.metadata.duration}
            />
          </ValidatedForm>
        </WidgetEditor>
      )
    );
  }
}
