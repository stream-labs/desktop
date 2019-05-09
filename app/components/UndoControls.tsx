import TsxComponent from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { EditorCommandsService } from 'services/editor-commands';

@Component({})
export default class UndoControls extends TsxComponent<{}> {
  @Inject() private editorCommandsService: EditorCommandsService;

  get nextUndo() {
    return this.editorCommandsService.nextUndo;
  }

  get nextRedo() {
    return this.editorCommandsService.nextRedo;
  }

  render(h: Function) {
    return (
      <div>
        {this.editorCommandsService.state.operationInProgress ? (
          <div>IN PROGRESS</div>
        ) : (
          <div>
            Undo: {this.nextUndo && this.nextUndo.description}
            <br />
            Redo: {this.nextRedo && this.nextRedo.description}
          </div>
        )}
      </div>
    );
  }
}
