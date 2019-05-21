import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ModalLayout from 'components/ModalLayout.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import TsxComponent from 'components/tsx-component';
import { SelectionService } from 'services/selection';
import { $t } from 'services/i18n';
import { NumberInput } from 'components/shared/inputs/inputs';
import { WindowsService } from 'services/windows';
import { EditorCommandsService } from 'services/editor-commands';
import { v2 } from 'util/vec2';
import { AnchorPositions, AnchorPoint } from 'util/ScalableRectangle';

const dirMap = (dir: string) =>
  ({
    left: $t('Left'),
    right: $t('Right'),
    top: $t('Top'),
    bottom: $t('Bottom'),
  }[dir]);

@Component({})
export default class EditTransform extends TsxComponent<{}> {
  @Inject() selectionService: SelectionService;
  @Inject() windowsService: WindowsService;
  @Inject() private editorCommandsService: EditorCommandsService;

  selection = this.selectionService.getActiveSelection();

  // We only care about the attributes of the rectangle not the functionality
  rect = { ...this.selection.getBoundingRect() };

  $refs: {
    validForm: ValidatedForm;
  };

  get transform() {
    return this.selection.getItems()[0].transform;
  }

  setCrop(cropEdge: keyof ICrop) {
    return async (value: string) => {
      if (await this.$refs.validForm.validateAndGetErrorsCount()) return;

      this.editorCommandsService.executeCommand('CropItemsCommand', this.selection, {
        [cropEdge]: Number(value),
      });
    };
  }

  setPos(dir: string) {
    return async (value: string) => {
      if (await this.$refs.validForm.validateAndGetErrorsCount()) return;
      const delta = Number(value) - Math.round(this.rect[dir]);

      this.editorCommandsService.executeCommand('MoveItemsCommand', this.selection, {
        [dir]: delta,
      });

      this.rect[dir] += delta;
    };
  }

  setScale(dir: string) {
    return async (value: string) => {
      if (await this.$refs.validForm.validateAndGetErrorsCount()) return;
      if (Number(value) === this.rect[dir]) return;
      const scale = Number(value) / this.rect[dir];
      const scaleX = dir === 'width' ? scale : 1;
      const scaleY = dir === 'height' ? scale : 1;
      const scaleDelta = v2(scaleX, scaleY);

      this.editorCommandsService.executeCommand(
        'ResizeItemsCommand',
        this.selection,
        scaleDelta,
        AnchorPositions[AnchorPoint.NorthWest],
      );

      this.rect[dir] = Number(value);
    };
  }

  rotate(deg: number) {
    return () =>
      this.editorCommandsService.executeCommand('RotateItemsCommand', this.selection, deg);
  }

  reset() {
    this.editorCommandsService.executeCommand('ResetTransformCommand', this.selection);
    this.rect = this.selection.getBoundingRect();
  }

  cancel() {
    this.windowsService.closeChildWindow();
  }

  cropForm(h: Function) {
    return this.selection.isSceneItem() ? (
      <HFormGroup metadata={{ title: $t('Crop') }}>
        {['left', 'right', 'top', 'bottom'].map((dir: keyof ICrop) => (
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <NumberInput
              value={this.transform.crop[dir]}
              metadata={{ isInteger: true, min: 0 }}
              onInput={this.setCrop(dir)}
            />
            <span style="margin-left: 8px;">{dirMap(dir)}</span>
          </div>
        ))}
      </HFormGroup>
    ) : null;
  }

  coordinateForm(h: Function, type: string) {
    const title = type === 'pos' ? $t('Position') : $t('Size');
    const dataArray = type === 'pos' ? ['x', 'y'] : ['width', 'height'];
    const inputHandler = type === 'pos' ? this.setPos : this.setScale;
    return (
      <HFormGroup metadata={{ title }}>
        <div style="display: flex;">
          {dataArray.map(dir => (
            <div style="margin-right: 8px;">
              <NumberInput
                value={Math.round(this.rect[dir])}
                metadata={{ isInteger: true, min: type === 'pos' ? null : 1 }}
                onInput={inputHandler(dir)}
              />
            </div>
          ))}
        </div>
      </HFormGroup>
    );
  }

  render(h: Function) {
    return (
      <ModalLayout customControls showControls={false}>
        <ValidatedForm slot="content" name="transform" ref="validForm">
          {this.coordinateForm(h, 'pos')}
          {this.coordinateForm(h, 'scale')}
          <HFormGroup metadata={{ title: $t('Rotation') }}>
            <button class="button button--default" style="width: 172px;" onClick={this.rotate(90)}>
              {$t('Rotate 90 Degrees CW')}
            </button>
            <div style="margin: 8px;" />
            <button class="button button--default" style="width: 172px;" onClick={this.rotate(-90)}>
              {$t('Rotate 90 Degrees CCW')}
            </button>
          </HFormGroup>
          {this.cropForm(h)}
        </ValidatedForm>

        <div slot="controls">
          <button class="button button--default" onClick={this.reset}>
            {$t('Reset')}
          </button>
          <button class="button button--action" onClick={this.cancel}>
            {$t('Done')}
          </button>
        </div>
      </ModalLayout>
    );
  }
}
