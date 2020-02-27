import cx from 'classnames';
import TsxComponent, { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ModalLayout from 'components/ModalLayout.vue';
import { EInputType } from 'components/shared/inputs/index';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { ImagePickerInput } from 'components/shared/inputs/inputs';
import { Inject } from 'services/core/injector';
import { LayoutService } from 'services/layout';
import { $t } from 'services/i18n';

class AddTabModalProps {
  onClose: () => void;
}

@Component({ props: createProps(AddTabModalProps) })
export default class AddTabModal extends TsxComponent<AddTabModalProps> {
  @Inject() private layoutService: LayoutService;

  newTabName = '';
  icon = '';

  icons = [{ title: '', value: '', description: '' }];

  createTab() {
    this.layoutService.addTab(this.newTabName, this.icon);
    this.$emit('close');
  }

  cancel() {
    this.$emit('close');
  }

  get canSave() {
    return this.icon && this.newTabName;
  }

  render() {
    return (
      <ModalLayout
        customControls={true}
        showControls={false}
        hasTitleBar={false}
        style="width: 400px; height: 350px;"
      >
        <div slot="content">
          <VFormGroup metadata={{ title: $t('Icon') }}>
            <ImagePickerInput vModel={this.icon} metadata={{ options: this.icons }} />
          </VFormGroup>
          <VFormGroup
            vModel={this.newTabName}
            metadata={{ title: $t('Name'), type: EInputType.text }}
          />
        </div>
        <div slot="controls">
          <button class="button button--default" onClick={() => this.cancel()}>
            {$t('Cancel')}
          </button>
          <button
            class="button button--action"
            onClick={() => this.createTab()}
            disabled={this.canSave}
          >
            {$t('Save New Tab')}
          </button>
        </div>
      </ModalLayout>
    );
  }
}
