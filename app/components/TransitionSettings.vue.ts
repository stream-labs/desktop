import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { TransitionsService, ETransitionType } from 'services/transitions';
import * as inputComponents from 'components/obs/inputs';
import { TObsFormData, IObsListInput, IObsInput } from 'components/obs/inputs/ObsInput';
import GenericForm from 'components/obs/inputs/GenericForm.vue';
import { $t } from 'services/i18n';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';

@Component({
  components: {
    GenericForm,
    VFormGroup,
    ...inputComponents,
  },
})
export default class SceneTransitions extends Vue {
  @Inject() transitionsService: TransitionsService;

  @Prop() transitionId: string;

  get typeModel(): IObsListInput<ETransitionType> {
    return {
      description: $t('Type'),
      name: 'type',
      value: this.transition.type,
      options: this.transitionsService.getTypes(),
    };
  }

  set typeModel(model: IObsListInput<ETransitionType>) {
    this.transitionsService.changeTransitionType(this.transitionId, model.value);
    this.properties = this.transitionsService.getPropertiesFormData(this.transitionId);
  }

  get durationModel(): IObsInput<number> {
    return {
      description: $t('Duration'),
      name: 'duration',
      value: this.transition.duration,
    };
  }

  set durationModel(model: IObsInput<number>) {
    this.transitionsService.setDuration(this.transitionId, model.value);
  }

  get nameModel(): string {
    return this.transition.name;
  }

  set nameModel(name: string) {
    this.transitionsService.renameTransition(this.transitionId, name);
  }

  get transition() {
    return this.transitionsService.getTransition(this.transitionId);
  }

  properties = this.transitionsService.getPropertiesFormData(this.transitionId);

  saveProperties(props: TObsFormData) {
    this.transitionsService.setPropertiesFormData(this.transitionId, props);
  }
}
