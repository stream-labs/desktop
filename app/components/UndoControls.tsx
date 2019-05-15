import TsxComponent from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { EditorCommandsService } from 'services/editor-commands';
import styles from './UndoControls.m.less';
import cx from 'classnames';

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
        <i
          class={cx('fa fa-undo', styles.undoButton, {
            [styles.undoButtonActive]: this.nextUndo,
          })}
          onClick={() => this.editorCommandsService.undo()}
          v-tooltip={{
            content: `Undo ${this.editorCommandsService.nextUndoDescription}`,
            placement: 'left',
          }}
        />
        <i
          class={cx('fa fa-redo', styles.undoButton, {
            [styles.undoButtonActive]: this.nextRedo,
          })}
          onClick={() => this.editorCommandsService.redo()}
          v-tooltip={{
            content: `Redo ${this.editorCommandsService.nextRedoDescription}`,
            placement: 'right',
          }}
        />
      </div>
    );
  }
}
