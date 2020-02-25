import cx from 'classnames';
import TsxComponent from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import styles from './LayoutEditor.m.less';
import { EInputType } from 'components/shared/inputs/index';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { ImagePickerInput } from 'components/shared/inputs/inputs';
import { Inject } from 'services/core/injector';
import { LayoutService } from 'services/layout';
import { $t } from 'services/i18n';

@Component({})
export default class AddTabModal extends TsxComponent {
  @Inject() private layoutService: LayoutService;

  newTabName = '';
  icon = '';

  icons = [{ title: '', value: '', description: '' }];

  createTab() {
    this.layoutService.addTab(this.newTabName, this.icon);
    this.$emit('tabCreated');
  }

  render() {
    return (
      <div>
        <VFormGroup metadata={{ title: $t('Icon') }}>
          <ImagePickerInput vModel={this.icon} metadata={{ options: this.icons }} />
        </VFormGroup>
        <VFormGroup
          vModel={this.newTabName}
          metadata={{ title: $t('Name'), type: EInputType.text }}
        />
        <div>
          <button class="button button--default">{$t('Cancel')}</button>
          <button class="button button--action" onClick={() => this.createTab()}>
            {$t('Save New Tab')}
          </button>
        </div>
      </div>
    );
  }
}
