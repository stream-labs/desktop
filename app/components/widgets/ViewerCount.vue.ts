import { Component } from 'vue-property-decorator';

import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';

import { inputComponents } from 'components/widgets/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { IViewerCountData, ViewerCountService } from 'services/widget-settings/viewer-count';
import CodeEditor from './CodeEditor.vue';
import { $t } from 'services/i18n';

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    CodeEditor,
    ...inputComponents
  }
})
export default class ViewerCount extends WidgetSettings<IViewerCountData, ViewerCountService> {
  settings = [
    { value: 'manage-count', label: $t('Manage Viewer Count') },
    { value: 'font', label: $t('Font Settings') },
    { value: 'source', label: $t('Source') }
  ];
}
