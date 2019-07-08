import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { TransitionsService } from 'services/transitions';
import * as inputComponents from 'components/shared/forms';
import { IListInput, IFormInput } from 'components/shared/forms/Input';
import { ScenesService, Scene } from 'services/scenes';
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

  get fromSceneModel(): IListInput<string> {
    return {
      description: $t('transitions.connectionFrom'),
      name: 'from',
      value: this.connection.fromSceneId,
      options: this.sceneOptions
    };
  }

  set fromSceneModel(model: IListInput<string>) {
    this.transitionsService.updateConnection(this.connectionId, {
      fromSceneId: model.value
    });
  }

  get toSceneModel(): IListInput<string> {
    return {
      description: $t('transitions.connectionTo'),
      name: 'to',
      value: this.connection.toSceneId,
      options: this.sceneOptions
    };
  }

  set toSceneModel(model: IListInput<string>) {
    this.transitionsService.updateConnection(this.connectionId, {
      toSceneId: model.value
    });
  }

  get transitionModel(): IListInput<string> {
    return {
      description: $t('transitions.sceneTransition'),
      name: 'transition',
      value: this.connection.transitionId,
      options: this.transitionOptions
    };
  }

  set transitionModel(model: IListInput<string>) {
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
