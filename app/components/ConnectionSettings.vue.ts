import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { TransitionsService } from 'services/transitions';
import { ScenesService } from 'services/scenes';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';

@Component({
  components: { VFormGroup },
})
export default class SceneTransitions extends Vue {
  @Inject() transitionsService: TransitionsService;
  @Inject() scenesService: ScenesService;

  @Prop() connectionId: string;

  get fromSceneModel(): string {
    return this.connection.fromSceneId;
  }

  set fromSceneModel(value: string) {
    this.transitionsService.updateConnection(this.connectionId, { fromSceneId: value });
  }

  get toSceneModel(): string {
    return this.connection.toSceneId;
  }

  set toSceneModel(value: string) {
    this.transitionsService.updateConnection(this.connectionId, { toSceneId: value });
  }

  get transitionModel(): string {
    return this.connection.transitionId;
  }

  set transitionModel(value: string) {
    this.transitionsService.updateConnection(this.connectionId, { transitionId: value });
  }

  get connection() {
    return this.transitionsService.getConnection(this.connectionId);
  }

  get sceneOptions() {
    return [
      { title: $t('All'), value: 'ALL' },
      ...this.scenesService.scenes.map(scene => ({
        title: scene.name,
        value: scene.id,
      })),
    ];
  }

  get transitionOptions() {
    return this.transitionsService.state.transitions.map(transition => ({
      title: transition.name,
      value: transition.id,
    }));
  }
}
