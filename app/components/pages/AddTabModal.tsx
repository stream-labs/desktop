import electron from 'electron';
import TsxComponent, { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ModalLayout from 'components/ModalLayout.vue';
import { EInputType, metadata } from 'components/shared/inputs/index';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { ImagePickerInput } from 'components/shared/inputs/inputs';
import { Inject } from 'services/core/injector';
import { LayoutService } from 'services/layout';
import { $t } from 'services/i18n';
import { UserService } from 'services/user';

const ICONS = [
  { title: '', value: 'icon-studio', description: 'icon-studio' },
  { title: '', value: 'icon-widgets', description: 'icon-widgets' },
  { title: '', value: 'icon-settings-3-1', description: 'icon-settings-3-1' },
  { title: '', value: 'icon-graph', description: 'icon-graph' },
  { title: '', value: 'icon-lock', description: 'icon-lock' },
  { title: '', value: 'icon-live-dashboard', description: 'icon-live-dashboard' },
  { title: '', value: 'icon-ideas', description: 'icon-ideas' },
  { title: '', value: 'icon-wish-list', description: 'icon-wish-list' },
  { title: '', value: 'icon-framed-poster', description: 'icon-framed-poster' },
  { title: '', value: 'icon-integrations-2', description: 'icon-integrations-2' },
  { title: '', value: 'icon-camera', description: 'icon-camera' },
  { title: '', value: 'icon-audio', description: 'icon-audio' },
];

class AddTabModalProps {
  onClose: () => void;
}

@Component({ props: createProps(AddTabModalProps) })
export default class AddTabModal extends TsxComponent<AddTabModalProps> {
  @Inject() private layoutService: LayoutService;
  @Inject() private userService: UserService;

  name = '';
  icon = '';

  async createTab() {
    this.layoutService.addTab(this.name, this.icon);
    this.$emit('close');
  }

  cancel() {
    this.$emit('close');
  }

  get canSave() {
    return !!this.icon && !!this.name;
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
            <ImagePickerInput vModel={this.icon} metadata={{ options: ICONS, isIcons: true }} />
          </VFormGroup>
          <VFormGroup
            vModel={this.name}
            metadata={metadata.text({ title: $t('Name'), fullWidth: true })}
          />
        </div>
        <div slot="controls">
          <button class="button button--default" onClick={() => this.cancel()}>
            {$t('Cancel')}
          </button>
          <button
            class="button button--action"
            onClick={() => this.createTab()}
            disabled={!this.canSave}
          >
            {$t('Save New Tab')}
          </button>
        </div>
      </ModalLayout>
    );
  }
}
