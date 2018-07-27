import { Component, Prop, Watch } from 'vue-property-decorator';
import {
  SponsorBannerService,
  ISponsorBannerData
} from 'services/widget-settings/sponsor-banner';

import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from './WidgetSettings.vue';

import { inputComponents } from 'components/shared/inputs';
import { AnimationInput } from './inputs';
import FormGroup from 'components/shared/inputs/FormGroup.vue';
import { $t } from 'services/i18n';

@Component({
  components: {
    WidgetWindow,
    FormGroup,
    AnimationInput,
    ...inputComponents
  }
})
export default class SponsorBanner extends WidgetSettings<ISponsorBannerData, SponsorBannerService> {
  placementOptions = [{ title: $t('Single'), value: 'single' }, { title: $t('Double'), value: 'double' }];
}
