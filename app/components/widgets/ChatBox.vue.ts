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
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    ValidatedForm,
    ...inputComponents
  }
})
export default class ChatBox extends WidgetSettings<IChatBoxData, ChatBoxService> {

  navItems = [
    { value: 'visual', label: $t('Visual Settings') },
    { value: 'font', label: $t('Font Settings') },
    { value: 'chatter', label: $t('Chatter') },
    { value: 'source', label: $t('Source') }
  ];
}
