import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { TransitionsService, ETransitionType } from 'services/transitions';
import * as inputComponents from 'components/obs/inputs';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import GenericForm from 'components/obs/inputs/GenericForm.vue';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { EditorCommandsService } from 'services/editor-commands';
import { debounce } from 'lodash-decorators';
import { Subscription } from 'rxjs';
import isEqual from 'lodash/isEqual';

@Component({
  components: {
    GenericForm,
    HFormGroup,
    ...inputComponents,
  },
})
export default class SceneTransitions extends Vue {
  @Inject() transitionsService: TransitionsService;
  @Inject() private editorCommandsService: EditorCommandsService;

  @Prop() transitionId: string;

  propertiesChanged: Subscription;

  mounted() {
    this.propertiesChanged = this.transitionsService.transitionPropertiesChanged.subscribe(id => {
      if (id === this.transitionId) {
        this.properties = this.transitionsService.getPropertiesFormData(this.transitionId);
      }
    });
  }

  get typeModel(): ETransitionType {
    return this.transitionsService.state.transitions.find(tran => tran.id === this.transitionId)
      .type;
  }

  set typeModel(value: ETransitionType) {
    this.editorCommandsService.executeCommand('EditTransitionCommand', this.transitionId, {
      type: value,
    });
  }

  get typeOptions() {
    return this.transitionsService.getTypes();
  }

  get durationModel(): number {
    return this.transitionsService.state.transitions.find(tran => tran.id === this.transitionId)
      .duration;
  }

  @debounce(500)
  set durationModel(value: number) {
    this.editorCommandsService.executeCommand('EditTransitionCommand', this.transitionId, {
      duration: value,
    });
  }

  get nameModel(): string {
    return this.transitionsService.state.transitions.find(tran => tran.id === this.transitionId)
      .name;
  }

  @debounce(500)
  set nameModel(name: string) {
    this.editorCommandsService.executeCommand('EditTransitionCommand', this.transitionId, { name });
  }

  get transition() {
    return this.transitionsService.getTransition(this.transitionId);
  }

  properties = this.transitionsService.getPropertiesFormData(this.transitionId);

  saveProperties(props: TObsFormData) {
    if (isEqual(this.properties, props)) return;

    this.properties = props;
    this.debouncedSaveProperties(props);
  }

  @debounce(500)
  debouncedSaveProperties(props: TObsFormData) {
    this.editorCommandsService.executeCommand('EditTransitionCommand', this.transitionId, {
      formData: props,
    });
  }
}
