import { Component } from 'vue-property-decorator';

import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from './WidgetSettings.vue';

import * as comps from 'components/shared/widget-inputs';
import WFormGroup from 'components/shared/widget-inputs/WFormGroup.vue';
import { $t } from 'services/i18n';
import { IViewerCountData, ViewerCountService } from 'services/widget-settings/viewer-count';

@Component({
  components: {
    WidgetWindow,
    WFormGroup,
    ...comps
  }
})
export default class ViewerCount extends WidgetSettings<IViewerCountData, ViewerCountService> {

}
