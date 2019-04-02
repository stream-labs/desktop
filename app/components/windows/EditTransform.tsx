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

  get transform() {
    return this.selectionService.getTransform();
  }

  setTransform(key: string, subkey: string) {
    return (value: string) =>
      this.selectionService.setTransform({ [key]: { [subkey]: Number(value) } });
  }

  setPos(dir: 'x' | 'y') {
    return (value: string) => {
      const delta = Number(value) - Math.round(this.rect[dir]);
      this.selectionService.setDeltaPos(dir, delta);
      this.rect[dir] += delta;
    };
  }

  setScale(dir: 'width' | 'height') {
    const scaleKey: 'x' | 'y' = dir === 'width' ? 'x' : 'y';
    return (value: string) => {
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
    this.rect = { ...this.originRect, x: 0, y: 0 };
  }

  cancel() {
    this.windowsService.closeChildWindow();
  }

  cropForm(h: Function) {
    return this.transform ? (
      <HFormGroup metadata={{ title: $t('Crop') }}>
        {['left', 'right', 'top', 'bottom'].map(dir => (
          <div style="display: flex; justify-content: space-between; margin: 0 70px 8px 0; align-items: baseline;">
            <span>{dirMap(dir)}</span>
            <NumberInput
              value={this.transform.crop[dir]}
              metadata={{ isInteger: true }}
              onInput={this.setTransform('crop', dir)}
            />
          </div>
        ))}
      </HFormGroup>
    ) : null;
  }

  render(h: Function) {
    return (
      <ModalLayout customControls showControls={false}>
        <ValidatedForm slot="content" name="transform">
          <HFormGroup metadata={{ title: $t('Position') }}>
            <div style="display: flex;">
              {['x', 'y'].map((dir: 'x' | 'y') => (
                <NumberInput
                  value={Math.round(this.rect[dir])}
                  metadata={{ isInteger: true }}
                  onInput={this.setPos(dir)}
                />
              ))}
            </div>
          </HFormGroup>
          <HFormGroup metadata={{ title: $t('Size') }}>
            <div style="display: flex;">
              {['width', 'height'].map((dir: 'width' | 'height') => (
                <NumberInput
                  value={Math.round(this.rect[dir])}
                  metadata={{ isInteger: true }}
                  onInput={this.setScale(dir)}
                />
              ))}
            </div>
          </HFormGroup>
          <HFormGroup metadata={{ title: $t('Rotation') }}>
            <button class="button button--default" onClick={this.rotate(90)}>
              {$t('Rotate 90 Degrees CW')}
            </button>
            <div style="margin: 8px;" />
            <button class="button button--default" onClick={this.rotate(-90)}>
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
