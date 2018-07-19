import { Component } from 'vue-property-decorator';
import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from 'components/widget-settings/WidgetSettings.vue';

import * as comps from 'components/shared/widget-inputs';
import WFormGroup from 'components/shared/widget-inputs/WFormGroup.vue';
import { $t } from 'services/i18n';
import WForm from 'components/shared/widget-inputs/WForm.vue';
import { IStreamBossCreateOptions, IStreamBossData, StreamBossService } from 'services/widget-settings/stream-boss';

@Component({
  components: {
    WidgetWindow,
    WFormGroup,
    WForm,
    ...comps
  }
})
export default class StreamBoss extends WidgetSettings<IStreamBossData, StreamBossService> {

  $refs: {
    form: WForm;
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

}
