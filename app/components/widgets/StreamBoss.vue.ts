import { Component } from 'vue-property-decorator';
import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from 'components/widgets/WidgetSettings.vue';

import { inputComponents } from 'components/widgets/inputs';
import FormGroup from 'components/shared/inputs/FormGroup.vue';
import { $t } from 'services/i18n/index';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { IStreamBossCreateOptions, IStreamBossData, StreamBossService } from 'services/widgets/settings/stream-boss';
import CodeEditor from './CodeEditor.vue';
import TestButtons from './TestButtons.vue';

@Component({
  components: {
    WidgetWindow,
    FormGroup,
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
    return this.loaded && this.wData.goal;
  }

  async saveGoal() {
    const hasErrors = await this.$refs.form.validateAndCheckErrors();
    if (hasErrors) return;
    await this.save(this.bossCreateOptions);
  }

}
