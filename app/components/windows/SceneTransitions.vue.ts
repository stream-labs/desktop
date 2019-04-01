import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { TransitionsService, ETransitionType } from 'services/transitions';
import { WindowsService } from 'services/windows';
import ModalLayout from 'components/ModalLayout.vue';
import TransitionSettings from 'components/TransitionSettings.vue';
import { $t } from 'services/i18n';
import Tabs, { ITab } from 'components/Tabs.vue';
import { ScenesService } from 'services/scenes';
import ConnectionSettings from 'components/ConnectionSettings.vue';
import VModal from 'vue-js-modal';

Vue.use(VModal);

@Component({
  components: {
    ModalLayout,
    TransitionSettings,
    Tabs,
    ConnectionSettings,
  },
})
export default class SceneTransitions extends Vue {
  @Inject() transitionsService: TransitionsService;
  @Inject() windowsService: WindowsService;
  @Inject() scenesService: ScenesService;

  inspectedTransition = '';
  inspectedConnection = '';

  tabs: ITab[] = [
    {
      name: 'Transitions',
      value: 'transitions',
    },
    {
      name: 'Connections',
      value: 'connections',
    },
  ];

  selectedTab = 'transitions';

  redundantConnectionTooltip = $t(
    'This connection is redundant because another connection already connects these scenes.',
  );

  get transitionsEnabled() {
    return this.scenesService.scenes.length > 1;
  }

  /**
   * Scene transitions created from apps should not be editable
   * if the app developer specified `shouldLock` as part of their
   * scene transition creation options.
   *
   * @param id ID of the scene transition
   */
  isEditable(id: string) {
    return this.transitionsService.getPropertiesManagerSettings(id).locked !== true;
  }

  getEditableMessage(id: string) {
    if (this.isEditable(id)) {
      return null;
    }

    return $t('This scene transition is managed by an App and cannot be edited.');
  }

  getClassNames(id: string) {
    return this.isEditable(id) ? 'icon-edit' : 'disabled icon-lock';
  }

  // TRANSITIONS

  get transitions() {
    return this.transitionsService.state.transitions;
  }

  get defaultTransitionId() {
    return this.transitionsService.state.defaultTransitionId;
  }

  addTransition() {
    const transition = this.transitionsService.createTransition(
      ETransitionType.Cut,
      'New Transition',
    );
    this.editTransition(transition.id);
  }

  editTransition(id: string) {
    if (!this.isEditable(id)) {
      return;
    }
    this.inspectedTransition = id;
    this.$modal.show('transition-settings');
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

  // CONNECTIONS

  get connections() {
    return this.transitionsService.state.connections;
  }

  addConnection() {
    const connection = this.transitionsService.addConnection(
      this.scenesService.scenes[0].id,
      this.scenesService.scenes[1].id,
      this.transitions[0].id,
    );
    this.editConnection(connection.id);
  }

  editConnection(id: string) {
    this.inspectedConnection = id;
    this.$modal.show('connection-settings');
  }

  deleteConnection(id: string) {
    this.transitionsService.deleteConnection(id);
  }

  getTransitionName(id: string) {
    const transition = this.transitionsService.getTransition(id);

    if (transition) return transition.name;
    return `<${$t('Deleted')}>`;
  }

  getSceneName(id: string | 'ALL') {
    if (id === 'ALL') return $t('All');

    const scene = this.scenesService.getScene(id);

    if (scene) return scene.name;
    return `<${$t('Deleted')}>`;
  }

  isConnectionRedundant(id: string) {
    return this.transitionsService.isConnectionRedundant(id);
  }

  nameForType(type: ETransitionType) {
    return this.transitionsService.getTypes().find(t => t.value === type).title;
  }

  done() {
    this.windowsService.closeChildWindow();
  }

  dismissModal(modal: string) {
    this.$modal.hide(modal);
  }
}
