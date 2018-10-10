import { Component } from 'vue-property-decorator';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import { inputComponents } from 'components/widgets/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { IAlertBoxData, AlertBoxService } from 'services/widgets/settings/alert-box';
import { $t } from 'services/i18n';

import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { Inject } from 'util/injector';

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    ValidatedForm,
    ...inputComponents
  }
})
export default class AlertBox extends WidgetSettings<IAlertBoxData, AlertBoxService> {
  @Inject() alertBoxService: AlertBoxService;

  alertTypes = this.alertBoxService.apiNames();

  selectedAlert = 'subs';

  afterFetch() {
    console.log(this.wData);
  }

  navItems = [
    { value: 'general', label: $t('General Settings') },
    { value: 'media', label: $t('Image & Video') },
    { value: 'meessage', label: $t('Donor Message') },
    { value: 'audio', label: $t('Audio') },
    { value: 'animation', label: $t('Animation') },
    { value: 'alert', label: $t('Alert Settings') },
    { value: 'source', label: $t('Source') }
  ];
}
