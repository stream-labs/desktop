import { Component } from 'vue-property-decorator';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from 'components/widgets/WidgetSettings.vue';

import { inputComponents } from 'components/widgets/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n/index';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import {
  IStreamBossCreateOptions,
  IStreamBossData,
  StreamBossService,
} from 'services/widgets/settings/stream-boss';

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    ValidatedForm,
    ...inputComponents,
  },
})
export default class StreamBoss extends WidgetSettings<IStreamBossData, StreamBossService> {
  $refs: {
    form: ValidatedForm;
  };

  bossCreateOptions: IStreamBossCreateOptions = {
    mode: 'fixed',
    total_health: 4800,
  };

  textColorTooltip = $t('A hex code for the base text color.');

  get hasGoal() {
    return this.loaded && this.wData.goal;
  }

  async saveGoal() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;
    await this.service.saveGoal(this.bossCreateOptions);
  }

  navItems = [
    { value: 'goal', label: $t('Goal') },
    { value: 'manage-battle', label: $t('Manage Battle') },
    { value: 'visual', label: $t('Visual Settings') },
    { value: 'source', label: $t('Source') },
  ];

  async resetGoal() {
    await this.service.resetGoal();
  }
}
