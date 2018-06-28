import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { TransitionsService, ETransitionType } from 'services/transitions';
import { WindowsService } from 'services/windows';
import windowMixin from 'components/mixins/window';
import ModalLayout from 'components/ModalLayout.vue';
import TransitionSettings from 'components/TransitionSettings.vue';
import { $t } from 'services/i18n';

@Component({
  mixins: [windowMixin],
  components: {
    ModalLayout,
    TransitionSettings
  }
})
export default class SceneTransitions extends Vue {
  @Inject() transitionsService: TransitionsService;
  @Inject() windowsService: WindowsService;

  inspectedId = '';

  get transitions() {
    return this.transitionsService.state.transitions;
  }

  get defaultTransitionId() {
    return this.transitionsService.state.defaultTransitionId;
  }

  addTransition() {
    const transition = this.transitionsService.createTransition(
      ETransitionType.Cut,
      'New Transition'
    );
    this.editTransition(transition.id);
  }

  editTransition(id: string) {
    this.inspectedId = id;
    this.$modal.show('settings');
  }

  deleteTransition(id: string) {
    if (this.transitionsService.state.transitions.length === 1) {
      alert($t('You need at least 1 transition.'));
      return;
    }

    this.transitionsService.deleteTransition(id);
  }

  makeDefault(id: string) {
    this.transitionsService.setDefaultTransition(id);
  }

  done() {
    this.windowsService.closeChildWindow();
  }
}
