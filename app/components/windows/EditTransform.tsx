import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import ModalLayout from 'components/ModalLayout.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import TsxComponent from 'components/tsx-component';
import { SelectionService } from 'services/selection';
import { $t } from 'services/i18n';
import { NumberInput } from 'components/shared/inputs/inputs';
import { WindowsService } from 'services/windows';

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

  // We only care about the attributes of the rectangle not the functionality
  originRect = { ...this.selectionService.getBoundingRect() };
  rect = { ...this.selectionService.getBoundingRect() };

  $refs: {
    validForm: ValidatedForm;
  };

  get transform() {
    return this.selectionService.getTransform();
  }

  setTransform(key: string, subkey: string) {
    return async (value: string) => {
      if (await this.$refs.validForm.validateAndGetErrorsCount()) return;
      this.selectionService.setTransform({ [key]: { [subkey]: Number(value) } });
    };
  }

  setPos(dir: string) {
    return async (value: string) => {
      if (await this.$refs.validForm.validateAndGetErrorsCount()) return;
      const delta = Number(value) - Math.round(this.rect[dir]);
      this.selectionService.setDeltaPos(dir as 'x' | 'y', delta);
      this.rect[dir] += delta;
    };
  }

  setScale(dir: string) {
    const scaleKey: 'x' | 'y' = dir === 'width' ? 'x' : 'y';
    return async (value: string) => {
      if (await this.$refs.validForm.validateAndGetErrorsCount()) return;
      if (Number(value) === this.rect[dir]) return;
      const scale = Number(value) / this.rect[dir];
      this.selectionService.unilateralScale(scaleKey, scale);
      this.rect[dir] = Number(value);
    };
  }

  rotate(deg: number) {
    return () => this.selectionService.rotate(deg);
  }

  reset() {
    this.selectionService.resetTransform();
    this.rect = { ...this.originRect };
  }

  cancel() {
    this.windowsService.closeChildWindow();
  }

  cropForm(h: Function) {
    return this.transform ? (
      <HFormGroup metadata={{ title: $t('Crop') }}>
        {['left', 'right', 'top', 'bottom'].map(dir => (
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <NumberInput
              value={this.transform.crop[dir]}
              metadata={{ isInteger: true, min: 0 }}
              onInput={this.setTransform('crop', dir)}
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
