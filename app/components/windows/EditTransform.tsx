import { Component } from 'vue-property-decorator';
import cloneDeep from 'lodash/cloneDeep';
import { Inject } from 'util/injector';
import ModalLayout from 'components/ModalLayout.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import TsxComponent from 'components/tsx-component';
import { SelectionService } from 'services/selection';
import { $t } from 'services/i18n';
import { NumberInput } from 'components/shared/inputs/inputs';

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

  rect = cloneDeep(this.selectionService.getBoundingRect());

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
      console.log(value, delta);
      this.selectionService.setDeltaPos(dir, delta);
      this.rect[dir] += delta;
    };
  }

  render(h: Function) {
    return (
      <ModalLayout>
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
          <HFormGroup metadata={{ title: $t('Rotation') }}>
            <button class="button button--default">{$t('Rotate 90 Degrees CW')}</button>
            <button class="button button--default">{$t('Rotate 90 Degrees CCW')}</button>
          </HFormGroup>
          <HFormGroup metadata={{ title: $t('Size') }}>
            <div style="display: flex;">
              <NumberInput value={Math.round(this.rect.width)} metadata={{ isInteger: true }} />
              <NumberInput value={Math.round(this.rect.height)} metadata={{ isInteger: true }} />
            </div>
          </HFormGroup>
          {this.transform && (
            <HFormGroup metadata={{ title: $t('Crop') }}>
              {['left', 'right', 'top', 'bottom'].map(dir => (
                <div>
                  <span>{dirMap(dir)}</span>
                  <NumberInput
                    value={this.transform.crop[dir]}
                    metadata={{ isInteger: true }}
                    onInput={this.setTransform('crop', dir)}
                  />
                </div>
              ))}
            </HFormGroup>
          )}
        </ValidatedForm>
      </ModalLayout>
    );
  }
}
