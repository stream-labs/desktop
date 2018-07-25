import { Component, Prop, Watch } from 'vue-property-decorator';
import {
  SponsorBannerService,
  ISponsorBannerData
} from 'services/widget-settings/sponsor-banner';

import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from './WidgetSettings.vue';

import * as comps from 'components/shared/widget-inputs';
import WFormGroup from 'components/shared/widget-inputs/WFormGroup.vue';
import { $t } from 'services/i18n';

@Component({
  components: {
    WidgetWindow,
    WFormGroup,
    ...comps
  }
})
export default class SponsorBanner extends WidgetSettings<ISponsorBannerData, SponsorBannerService> {
  placementOptions = [{ title: $t('Single'), value: 'single' }, { title: $t('Double'), value: 'double' }];
}
