import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { TransitionsService, ETransitionType } from 'services/transitions';
import * as inputComponents from 'components/obs/inputs';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import GenericForm from 'components/obs/inputs/GenericForm.vue';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';

@Component({
  components: {
    GenericForm,
    HFormGroup,
    ...inputComponents,
  },
})
export default class SceneTransitions extends Vue {
  @Inject() transitionsService: TransitionsService;

  @Prop() transitionId: string;

  get typeModel(): ETransitionType {
    return this.transitionsService.state.transitions.find(tran => tran.id === this.transitionId)
      .type;
  }

  set typeModel(value: ETransitionType) {
    this.transitionsService.changeTransitionType(this.transitionId, value);
    this.properties = this.transitionsService.getPropertiesFormData(this.transitionId);
  }

  get typeOptions() {
    return this.transitionsService.getTypes();
  }

  get durationModel(): number {
    return this.transitionsService.state.transitions.find(tran => tran.id === this.transitionId)
      .duration;
  }

  set durationModel(value: number) {
    this.transitionsService.setDuration(this.transitionId, value);
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
