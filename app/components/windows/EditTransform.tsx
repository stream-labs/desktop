import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import ModalLayout from 'components/ModalLayout.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import TsxComponent from 'components/tsx-component';
import { SelectionService } from 'services/selection';
import { $t } from 'services/i18n';
import { EInputType } from 'components/shared/inputs';

@Component({})
export default class EditTransform extends TsxComponent<{}> {
  @Inject() selectionService: SelectionService;

  render(h: Function) {
    return (
      <ModalLayout>
        <ValidatedForm slot="content" name="transform">
          <HFormGroup value={0} metadata={{ type: EInputType.number, title: $t('Size') }} />
        </ValidatedForm>
      </ModalLayout>
    );
  }
}
