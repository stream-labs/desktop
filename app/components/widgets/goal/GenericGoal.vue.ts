import { Component } from 'vue-property-decorator';
import {
  GenericGoalService, IGoalCreateOptions,
  IGoalData
} from 'services/widgets/settings/generic-goal';
import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from 'components/widgets/WidgetSettings.vue';

import { inputComponents } from 'components/widgets/inputs';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import CodeEditor from '../CodeEditor.vue';
import CustomFieldsEditor from '../CustomFieldsEditor.vue';


@Component({
  components: {
    WidgetWindow,
    HFormGroup,
    ValidatedForm,
    CodeEditor,
    CustomFieldsEditor,
    ...inputComponents
  }
})
export default class GenericGoal extends WidgetSettings<IGoalData, GenericGoalService> {

  tab = 'goal';

  $refs: {
    form: ValidatedForm;
  };

  goalCreateOptions: IGoalCreateOptions = {
    title: '',
    goal_amount: 100,
    manual_goal_amount: 0,
    ends_at: ''
  };

  textColorTooltip = $t('A hex code for the base text color.');

  get hasGoal() {
    return this.loaded && this.wData.goal && this.wData.goal.title;
  }

  async saveGoal() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;
    await this.service.saveGoal(this.goalCreateOptions);
  }

  resetGoal() {
    this.service.resetGoal();
  }

}
