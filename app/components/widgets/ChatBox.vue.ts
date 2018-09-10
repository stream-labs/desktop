import { Component } from 'vue-property-decorator';
import {
  ChatBoxService,
  IChatBoxData
} from 'services/widgets/settings/chat-box';

import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from './WidgetSettings.vue';
import { inputComponents } from 'components/shared/inputs';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { $t } from 'services/i18n';
import CodeEditor from './CodeEditor.vue';

@Component({
  components: {
    WidgetWindow,
    HFormGroup,
    CodeEditor,
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
}
