import { Component, Prop } from 'vue-property-decorator';
import { inputComponents } from 'components/widgets/inputs';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from 'components/widgets/WidgetSettings.vue';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import {
  GenericGoalService,
  IGoalCreateOptions,
  IGoalData,
} from '../../../services/widgets/settings/generic-goal';

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    ValidatedForm,
    ...inputComponents,
  },
})
export default class GenericGoal extends WidgetSettings<IGoalData, GenericGoalService> {
  @Prop() goalType: string;

  $refs: {
    form: ValidatedForm;
  };

  goalCreateOptions: IGoalCreateOptions = {
    title: '',
    goal_amount: 100,
    manual_goal_amount: 0,
    ends_at: '',
  };

  navItems = [
    { value: 'goal', label: $t('Goal') },
    { value: 'visual', label: $t('Visual Settings') },
    { value: 'source', label: $t('Source') },
  ];

  get hasGoal() {
    return this.loaded && this.wData.goal;
  }

  async saveGoal() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;
    this.requestState = 'pending';
    try {
      await this.service.saveGoal(this.goalCreateOptions);
      this.requestState = 'success';
    } catch (e) {
      this.onFailHandler(e.message);
      this.requestState = 'fail';
    }
  }

  resetGoal() {
    this.service.resetGoal();
  }
}
