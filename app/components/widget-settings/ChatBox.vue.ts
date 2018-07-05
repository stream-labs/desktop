import { Component, Prop, Watch } from 'vue-property-decorator';
import {
  ChatBoxService,
  IChatBoxData
} from 'services/widget-settings/chat-box';

import WidgetLayout from '../windows/WidgetLayout.vue';
import WidgetSettings from './WidgetSettings.vue';

import * as comps from 'components/shared/widget-inputs';
import WFormGroup from 'components/shared/widget-inputs/WFormGroup.vue';

@Component({
  components: {
    WidgetLayout,
    WFormGroup,
    ...comps
  }
})
export default class ChatBox extends WidgetSettings<IChatBoxData, ChatBoxService> {


}
