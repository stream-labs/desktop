import { Component } from 'vue-property-decorator';
import { inputComponents } from 'components/widgets/inputs';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from 'components/widgets/WidgetSettings.vue';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import CodeEditor from '../CodeEditor.vue';
import CustomFieldsEditor from '../CustomFieldsEditor.vue';
import { GenericGoalService, IGoalCreateOptions, IGoalData } from '../../../services/widgets/settings/generic-goal';


@Component({
  components: {
    WidgetEditor,
    VFormGroup,
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

  navItems = [
    { value: 'goal', label: $t('Goal') },
    { value: 'visual', label: $t('Visual Settings') },
    { value: 'source', label: $t('Source') }
  ];

  get hasGoal() {
    return this.loaded && this.wData.goal;
  }

  async saveGoal() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;
    await this.service.saveGoal(this.goalCreateOptions);
  }

  resetGoal() {
    this.service.resetGoal();
  }

}
