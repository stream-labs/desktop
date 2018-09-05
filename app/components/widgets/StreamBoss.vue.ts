import { Component } from 'vue-property-decorator';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from 'components/widgets/WidgetSettings.vue';

import { inputComponents } from 'components/widgets/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n/index';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { IStreamBossCreateOptions, IStreamBossData, StreamBossService } from 'services/widget-settings/stream-boss';
import CodeEditor from './CodeEditor.vue';
import TestButtons from './TestButtons.vue';

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    ValidatedForm,
    CodeEditor,
    TestButtons,
    ...inputComponents
  }
})
export default class StreamBoss extends WidgetSettings<IStreamBossData, StreamBossService> {

  $refs: {
    form: ValidatedForm;
  };

  bossCreateOptions: IStreamBossCreateOptions = {
    mode: 'fixed',
    total_health: 4800
  };

  textColorTooltip = $t('A hex code for the base text color.');

  get hasGoal() {
    return this.wData.goal;
  }

  async saveGoal() {
    const hasErrors = await this.$refs.form.validateAndCheckErrors();
    if (hasErrors) return;
    await this.save(this.bossCreateOptions);
  }

  settings = [
    { value: 'goal', label: $t('Goal') },
    { value: 'manage-battle', label: $t('Manage Battle') },
    { value: 'visual', label: $t('Visual Settings') },
    { value: 'source', label: $t('Source') }
  ];

}
