import { Component } from 'vue-property-decorator';
import {
  EventListService,
  IEventListData
} from 'services/widget-settings/event-list';

import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from './WidgetSettings.vue';
import { inputComponents } from 'components/shared/inputs';
import { AnimationInput } from './inputs';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { $t } from 'services/i18n';
import CodeEditor from './CodeEditor.vue';
import TestButtons from './TestButtons.vue';

@Component({
  components: {
    WidgetWindow,
    HFormGroup,
    CodeEditor,
    TestButtons,
    AnimationInput,
    ...inputComponents
  }
})
export default class EventList extends WidgetSettings<IEventListData, EventListService> {
  get themeMetadata() {
    return Object.keys(this.wData.themes).map((theme) => ({
      title: this.wData.themes[theme].label,
      value: theme
    }));
  }

  textColorTooltip = $t('A hex code for the base text color.');

  backgroundColorTooltip = $t(
    'A hex code for the widget background. This is for preview purposes only. It will not be shown in your stream.'
  );

  minBitsTooltip = $t(
    'The smallest amount of bits a cheer must have for an event to be shown.' +
      ' Setting this to 0 will make every cheer trigger an event.'
  );

  fontSizeTooltip = $t('The font size in pixels. Reasonable size typically ranges between 24px and 48px.');
}
