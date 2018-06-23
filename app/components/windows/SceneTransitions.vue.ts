import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { TransitionsService } from 'services/transitions';
import * as inputComponents from 'components/shared/forms';
import { WindowsService } from 'services/windows';
import { TFormData } from 'components/shared/forms/Input';
import windowMixin from 'components/mixins/window';
import GenericForm from 'components/shared/forms/GenericForm.vue';
import ModalLayout from 'components/ModalLayout.vue';

@Component({
  mixins: [windowMixin],
  components: {
    ModalLayout,
    GenericForm,
    ...inputComponents
  }
})
export default class SceneTransitions extends Vue {
  @Inject() transitionsService: TransitionsService;
  @Inject() windowsService: WindowsService;

  defaultId = this.transitionsService.getDefaultTransition().id;

  form = this.transitionsService.getFormData(this.defaultId);
  properties = this.transitionsService.getPropertiesFormData(this.defaultId);

  setTransitionType() {
    this.transitionsService.changeTransitionType(this.defaultId, this.form.type.value);
    this.properties = this.transitionsService.getPropertiesFormData(this.defaultId);
  }

  setTransitionDuration() {
    this.transitionsService.setDuration(this.defaultId, this.form.duration.value);
  }

  saveProperties(props: TFormData) {
    this.transitionsService.setPropertiesFormData(this.defaultId, props);
  }

  done() {
    this.windowsService.closeChildWindow();
  }
}
