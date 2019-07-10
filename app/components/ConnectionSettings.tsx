import TsxComponent from 'components/tsx-component';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { TransitionsService } from 'services/transitions';
import { ScenesService } from 'services/scenes';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';
import { EditorCommandsService } from 'services/editor-commands';
import { metadata } from './shared/inputs';

@Component({})
export default class SceneTransitions extends TsxComponent<{ connectionId: string }> {
  @Inject() transitionsService: TransitionsService;
  @Inject() scenesService: ScenesService;
  @Inject() private editorCommandsService: EditorCommandsService;

  @Prop() connectionId: string;

  get fromSceneModel(): string {
    return this.connection.fromSceneId;
  }

  setFromSceneModel(value: string) {
    this.editorCommandsService.executeCommand('EditConnectionCommand', this.connectionId, {
      fromSceneId: value,
    });
  }

  get toSceneModel(): string {
    return this.connection.toSceneId;
  }

  setToSceneModel(value: string) {
    this.editorCommandsService.executeCommand('EditConnectionCommand', this.connectionId, {
      toSceneId: value,
    });
  }

  get transitionModel(): string {
    return this.connection.transitionId;
  }

  setTransitionModel(value: string) {
    this.editorCommandsService.executeCommand('EditConnectionCommand', this.connectionId, {
      transitionId: value,
    });
  }

  get connection() {
    return this.transitionsService.state.connections.find(conn => conn.id === this.connectionId);
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

  render(h: Function) {
    return (
      <div>
        <VFormGroup
          value={this.fromSceneModel}
          onInput={this.setFromSceneModel}
          metadata={metadata.list({
            title: $t('Beginning Scene'),
            name: 'from',
            options: this.sceneOptions,
          })}
        />
        <VFormGroup
          value={this.transitionModel}
          onInput={this.setTransitionModel}
          metadata={metadata.list({
            title: $t('Scene Transition'),
            name: 'transition',
            options: this.transitionOptions,
          })}
        />
        <VFormGroup
          value={this.toSceneModel}
          onInput={this.setToSceneModel}
          metadata={metadata.list({
            title: $t('Ending Scene'),
            name: 'to',
            options: this.sceneOptions,
          })}
        />
      </div>
    );
  }
}
