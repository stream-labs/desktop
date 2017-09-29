import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import { ScenesTransitionsService } from '../../services/scenes-transitions';
import ModalLayout from '../ModalLayout.vue';
import * as inputComponents from '../shared/forms';
import { WindowsService } from '../../services/windows';
import windowMixin from '../mixins/window';

@Component({
  mixins: [windowMixin],
  components: {
    ModalLayout,
    ...inputComponents
  }
})
export default class SceneTransitions extends Vue {

  @Inject('ScenesTransitionsService')
  transitionsService: ScenesTransitionsService;

  @Inject()
  windowsService: WindowsService;
  form = this.transitionsService.getFormData();


  setTransitionType() {
    this.transitionsService.setType(this.form.type.value);
  }


  setTransitionDuration() {
    this.transitionsService.setDuration(this.form.duration.value);
  }


  done() {
    this.windowsService.closeChildWindow();
  }

}
