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

  get metadata() {
    return this.service.getMetadata(this.sectionOptions);
  }

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
    this.save();
  }

  addCategory() {
    this.wData.settings.categories.push({ color: '#ffffff', prize: 'Donut' });
    this.save();
  }

  removeCategory(prize: string) {
    this.wData.settings.categories = this.wData.settings.categories.filter((cat) => cat.prize !== prize);
    this.save();
  }

  get sectionOptions() {
    return this.wData.settings.categories.map((cat, i) => ({ title: cat.prize, value: i + 1 }));
  }

  removeSection(key: string) {
    this.wData.settings.sections = this.wData.settings.sections.filter((sect) => sect.key !== key);
    this.save();
  }

  moveSection(key: string, idxMod: number) {
    const sections = this.wData.settings.sections;
    const idx = sections.findIndex((sect) => sect.key === key);
    [sections[idx], sections[idx + idxMod]] = [sections[idx + idxMod], sections[idx]];
    this.save();
  }
}
