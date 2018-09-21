import { Component } from 'vue-property-decorator';
import {
  EventListService,
  IEventListData
} from 'services/widget-settings/event-list';

import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import { inputComponents } from 'components/shared/inputs';
import { AnimationInput } from './inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';
import CodeEditor from './CodeEditor.vue';
import TestButtons from './TestButtons.vue';

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
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

  settings = [
    { value: 'manage-list', label: $t('Manage List') },
    { value: 'font', label: $t('Font Settings') },
    { value: 'visual', label: $t('Visual Settings') },
    { value: 'source', label: $t('Source') }
  ];
}
