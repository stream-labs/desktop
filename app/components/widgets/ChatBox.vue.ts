import { Component } from 'vue-property-decorator';
import {
  ChatBoxService,
  IChatBoxData
} from 'services/widgets/settings/chat-box';

import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import { inputComponents } from 'components/shared/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';
import CodeEditor from './CodeEditor.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    CodeEditor,
    ValidatedForm,
    ...inputComponents
  }
})
export default class ChatBox extends WidgetSettings<IChatBoxData, ChatBoxService> {
  textColorTooltip = $t('A hex code for the base text color.');

  backgroundColorTooltip = $t(
    'A hex code for the widget background. This is for preview purposes only. It will not be shown in your stream.'
  );

  backgroundColorDescription = $t(
    'Note: This background color is for preview purposes only. It will not be shown in your stream.'
  );

  navItems = [
    { value: 'visual', label: $t('Visual Settings') },
    { value: 'font', label: $t('Font Settings') },
    { value: 'chatter', label: $t('Chatter') },
    { value: 'source', label: $t('Source') }
  ];
}
