import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { TransitionsService, ETransitionType } from 'services/transitions';
import * as inputComponents from 'components/shared/forms';
import { WindowsService } from 'services/windows';
import { TFormData, IListInput, IFormInput } from 'components/shared/forms/Input';
import GenericForm from 'components/shared/forms/GenericForm.vue';

@Component({
  components: {
    GenericForm,
    ...inputComponents
  }
})
export default class SceneTransitions extends Vue {
  @Inject() transitionsService: TransitionsService;
  @Inject() windowsService: WindowsService;

  @Prop() transitionId: string;

  // TODO: Localization
  get typeModel(): IListInput<ETransitionType> {
    return {
      description: 'Type',
      name: 'type',
      value: this.transition.type,
      options: this.transitionsService.getTypes()
    };
  }

  set typeModel(model: IListInput<ETransitionType>) {
    this.transitionsService.changeTransitionType(this.transitionId, model.value);
    this.properties = this.transitionsService.getPropertiesFormData(this.transitionId);
  }

  // TODO: Localization
  get durationModel(): IFormInput<number> {
    return {
      description: 'Duration',
      name: 'duration',
      value: this.transition.duration
    };
  }

  set durationModel(model: IFormInput<number>) {
    this.transitionsService.setDuration(this.transitionId, model.value);
  }

  get nameModel(): IFormInput<string> {
    return {
      description: 'Name',
      name: 'name',
      value: this.transition.name
    };
  }

  set nameModel(name: IFormInput<string>) {
    this.transitionsService.renameTransition(this.transitionId, name.value);
  }

  get transition() {
    return this.transitionsService.getTransition(this.transitionId);
  }

  properties = this.transitionsService.getPropertiesFormData(this.transitionId);

  saveProperties(props: TFormData) {
    this.transitionsService.setPropertiesFormData(this.transitionId, props);
  }

  done() {
    this.windowsService.closeChildWindow();
  }
}
