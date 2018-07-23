import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { TransitionsService } from 'services/transitions';
import * as inputComponents from 'components/obs/inputs';
import { IObsListInput } from 'components/obs/inputs/ObsInput';
import { ScenesService } from 'services/scenes';
import { $t } from 'services/i18n';

@Component({
  components: {
    ...inputComponents
  }
})
export default class SceneTransitions extends Vue {
  @Inject() transitionsService: TransitionsService;
  @Inject() scenesService: ScenesService;

  @Prop() connectionId: string;

  get fromSceneModel(): IObsListInput<string> {
    return {
      description: $t('Beginning Scene'),
      name: 'from',
      value: this.connection.fromSceneId,
      options: this.sceneOptions
    };
  }

  set fromSceneModel(model: IObsListInput<string>) {
    this.transitionsService.updateConnection(this.connectionId, {
      fromSceneId: model.value
    });
  }

  get toSceneModel(): IObsListInput<string> {
    return {
      description: $t('Ending Scene'),
      name: 'to',
      value: this.connection.toSceneId,
      options: this.sceneOptions
    };
  }

  set toSceneModel(model: IObsListInput<string>) {
    this.transitionsService.updateConnection(this.connectionId, {
      toSceneId: model.value
    });
  }

  get transitionModel(): IObsListInput<string> {
    return {
      description: $t('Scene Transition'),
      name: 'transition',
      value: this.connection.transitionId,
      options: this.transitionOptions
    };
  }

  set transitionModel(model: IObsListInput<string>) {
    this.transitionsService.updateConnection(this.connectionId, {
      transitionId: model.value
    });
  }

  get connection() {
    return this.transitionsService.getConnection(this.connectionId);
  }

  get sceneOptions() {
    return this.scenesService.scenes.map(scene => {
      return {
        description: scene.name,
        value: scene.id
      };
    });
  }

  get transitionOptions() {
    return this.transitionsService.state.transitions.map(transition => {
      return {
        description: transition.name,
        value: transition.id
      };
    });
  }

}
