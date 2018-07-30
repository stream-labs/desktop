import { Component } from 'vue-property-decorator';
import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from './WidgetSettings.vue';
import {
  TipJarService,
  ITipJarData
} from 'services/widget-settings/tip-jar';
import { inputComponents } from 'components/shared/inputs';
import FormGroup from 'components/shared/inputs/FormGroup.vue';

import { $t } from 'services/i18n';

@Component({
  components: {
    WidgetWindow,
    FormGroup,
    ...inputComponents
  }
})
export default class TipJar extends WidgetSettings<ITipJarData, TipJarService> {
  textColorTooltip = $t('A hex code for the base text color.');

  backgroundColorDescription = $t(
    'Note: This background color is for preview purposes only. It will not be shown in your stream.'
  );

  jarSrc = 'https://cdn.streamlabs.com/static/tip-jar/jars/glass-';
  inputOptions: { description: string, value: string }[] = [];

  fileNameFromHref(href: string) {
    if (!href) return null;
    return decodeURIComponent(href.split(/[\\/]/).pop());
  }

  afterFetch() {
    this.inputOptions = this.wData.jars.map((jar: string) => ({ description: `${this.jarSrc}${jar}.png`, value: jar }));
  }
}
