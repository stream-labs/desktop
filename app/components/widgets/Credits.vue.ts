import { Component } from 'vue-property-decorator';
import { CreditsService, ICreditsData } from 'services/widgets/settings/credits';

import { inputComponents } from 'components/widgets/inputs';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n/index';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    ValidatedForm,
    ...inputComponents,
  },
})
export default class Credits extends WidgetSettings<ICreditsData, CreditsService> {
  get themeOptions() {
    return Object.keys(this.wData.themes).map(theme => ({
      title: this.wData.themes[theme].label,
      value: theme,
    }));
  }

  rollCredits() {
    this.service.testRollCredits();
  }

  get metadata() {
    return this.service.getMetadata(this.themeOptions);
  }

  navItems = [
    { value: 'manage-credits', label: $t('Manage Credits') },
    { value: 'visual', label: $t('Visual Settings') },
    { value: 'source', label: $t('Source') },
  ];
}
