import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import { ScenesTransitionsService } from '../../services/scenes-transitions';
import * as inputComponents from '../shared/forms';
import { WindowsService } from '../../services/windows';
import { TFormData } from '../shared/forms/Input';
import windowMixin from '../mixins/window';
import GenericForm from '../shared/forms/GenericForm.vue';
import ModalLayout from '../ModalLayout.vue';

@Component({
  mixins: [windowMixin],
  components: {
    ModalLayout,
    GenericForm,
    ...inputComponents
  }
})
export default class SceneTransitions extends Vue {

  @Inject('ScenesTransitionsService')
  transitionsService: ScenesTransitionsService;

  @Inject()
  windowsService: WindowsService;
  form = this.transitionsService.getFormData();
  properties = this.transitionsService.getPropertiesFormData();


  setTransitionType() {
    this.transitionsService.setType(this.form.type.value);
    this.properties = this.transitionsService.getPropertiesFormData();
  }


  setTransitionDuration() {
    this.transitionsService.setDuration(this.form.duration.value);
  }

  saveProperties(props: TFormData) {
    this.transitionsService.setPropertiesFormData(props);
  }


  done() {
    this.windowsService.closeChildWindow();
  }

}
