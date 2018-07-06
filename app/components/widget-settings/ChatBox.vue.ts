import { Component, Prop, Watch } from 'vue-property-decorator';
import {
  ChatBoxService,
  IChatBoxData
} from 'services/widget-settings/chat-box';

import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from './WidgetSettings.vue';

import * as comps from 'components/shared/widget-inputs';
import WFormGroup from 'components/shared/widget-inputs/WFormGroup.vue';

@Component({
  components: {
    WidgetWindow,
    WFormGroup,
    ...comps
  }
})
export default class ChatBox extends WidgetSettings<IChatBoxData, ChatBoxService> {


}
