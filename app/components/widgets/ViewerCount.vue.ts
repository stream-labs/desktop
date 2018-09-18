import { Component } from 'vue-property-decorator';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import { inputComponents } from 'components/widgets/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { IViewerCountData, ViewerCountService } from 'services/widgets/settings/viewer-count';
import CodeEditor from './CodeEditor.vue';
import { $t } from 'services/i18n';

import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    CodeEditor,
    ValidatedForm,
    ...inputComponents
  }
})
export default class ViewerCount extends WidgetSettings<IViewerCountData, ViewerCountService> {
  navItems = [
    { value: 'manage-count', label: $t('Manage Viewer Count') },
    { value: 'font', label: $t('Font Settings') },
    { value: 'source', label: $t('Source') }
  ];
}
