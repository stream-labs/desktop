import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import ModalLayout from 'components/ModalLayout.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import TsxComponent from 'components/tsx-component';
import { SelectionService } from 'services/selection';
import { $t } from 'services/i18n';
import { NumberInput } from 'components/shared/inputs/inputs';
import { Rect } from 'util/rect';

@Component({})
export default class EditTransform extends TsxComponent<{}> {
  @Inject() selectionService: SelectionService;

  mounted() {
    console.log(this.selectionService.getTransform());
  }

  get rect() {
    return this.selectionService.getBoundingRect();
  }

  get lastSelected() {
    return this.selectionService.getLastSelected();
  }

  render(h: Function) {
    return (
      <ModalLayout>
        <ValidatedForm slot="content" name="transform">
          <HFormGroup metadata={{ title: $t('Position') }}>
            <div style="display: flex;">
              <NumberInput value={Math.round(this.rect.x)} metadata={{ isInteger: true }} />
              <NumberInput value={Math.round(this.rect.y)} metadata={{ isInteger: true }} />
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
          {this.selectionService.isSceneItem() && (
            <HFormGroup metadata={{ title: $t('Crop') }}>
              <div style="display: flex;">
                <span>{$t('Left')}</span>
                <NumberInput value={0} metadata={{ isInteger: true }} />
                <span>{$t('Right')}</span>
                <NumberInput value={0} metadata={{ isInteger: true }} />
              </div>
              <div style="display: flex;">
                <span>{$t('Top')}</span>
                <NumberInput value={0} metadata={{ isInteger: true }} />
                <span>{$t('Bottom')}</span>
                <NumberInput value={0} metadata={{ isInteger: true }} />
              </div>
            </HFormGroup>
          )}
        </ValidatedForm>
      </ModalLayout>
    );
  }
}
