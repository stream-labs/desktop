import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { TransitionsService } from 'services/transitions';
import * as inputComponents from 'components/shared/forms';
import { IListInput, IFormInput } from 'components/shared/forms/Input';
import { ScenesService, Scene } from 'services/scenes';

@Component({
  components: {
    ...inputComponents
  }
})
export default class SceneTransitions extends Vue {
  @Inject() transitionsService: TransitionsService;
  @Inject() scenesService: ScenesService;

  @Prop() connectionId: string;

  // TODO: Localization
  get fromSceneModel(): IListInput<string> {
    return {
      description: 'Beginning Scene',
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

  // TODO: Localization
  get toSceneModel(): IListInput<string> {
    return {
      description: 'Ending Scene',
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

  // TODO: Localization
  get transitionModel(): IListInput<string> {
    return {
      description: 'Scene Transition',
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
