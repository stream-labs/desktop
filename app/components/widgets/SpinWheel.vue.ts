import { Component, Prop, Watch } from 'vue-property-decorator';
import {
  SpinWheelService,
  ISpinWheelData
} from 'services/widgets/settings/spin-wheel';

import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';

import { inputComponents } from './inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';

import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    ValidatedForm,
    ...inputComponents
  }
})
export default class SpinWheel extends WidgetSettings<ISpinWheelData, SpinWheelService> {


  navItems = [
    { value: 'manage-wheel', label: $t('Manage Spin Wheel') },
    { value: 'categories', label: $t('Categories') },
    { value: 'section', label: $t('Section Weights') },
    { value: 'font', label: $t('Font Settings') },
    { value: 'border', label: $t('Border') },
    { value: 'ticker', label: $t('Ticker') },
    { value: 'image', label: $t('Center Image') },
    { value: 'source', label: $t('Source') }
  ];

  clearCategories() {
    this.wData.settings.categories = [];
  }

  addCategory() {
    this.wData.settings.categories.push({ color: '#ffffff', prize: 'Donut' });
  }
}
