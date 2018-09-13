import { Component } from 'vue-property-decorator';

import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from './WidgetSettings.vue';

import { inputComponents } from 'components/widgets/inputs';
import { IViewerCountData, ViewerCountService } from 'services/widgets/settings/viewer-count';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import CodeEditor from './CodeEditor.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

@Component({
  components: {
    WidgetWindow,
    HFormGroup,
    CodeEditor,
    ValidatedForm,
    ...inputComponents
  }
})
export default class ViewerCount extends WidgetSettings<IViewerCountData, ViewerCountService> {

}
