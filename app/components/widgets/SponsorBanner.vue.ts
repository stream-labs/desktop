import { Component, Prop, Watch } from 'vue-property-decorator';
import {
  SponsorBannerService,
  ISponsorBannerData
} from 'services/widget-settings/sponsor-banner';

import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from './WidgetSettings.vue';

import { inputComponents } from './inputs';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import CodeEditor from './CodeEditor.vue';

import { $t } from 'services/i18n';

@Component({
  components: {
    WidgetWindow,
    HFormGroup,
    CodeEditor,
    ...inputComponents
  }
})
export default class SponsorBanner extends WidgetSettings<ISponsorBannerData, SponsorBannerService> {
  placementOptions = [{ title: $t('Single'), value: 'single' }, { title: $t('Double'), value: 'double' }];

  hideDurationTooltip = $t('Set to zero to show the widget permanently.');
  showDurationTooltip =$t('The amount of time the widget will appear.');
  animationTooltip = $t('These are the animations that are used to show your banner.');

  get positions() {
    return this.wData.settings.placement_options === 'double' ? ['1', '2'] : ['1']
  }

  fileNameFromHref(href: string) {
    if (!href) return null;
    return decodeURIComponent(href.split(/[\\/]/).pop());
  }

  addImage(placement: string) {
    this.wData.settings[`placement_${placement}_images`].push({ href: $t('No Image'), duration: 10 })
  }

  removeImage(href: string, placement: string) {
    this.wData.settings[`placement_${placement}_images`] = this.wData.settings[`placement_${placement}_images`]
      .filter((image: { href: string }) => image.href !== href);
  }
}
