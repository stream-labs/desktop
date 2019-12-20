import TsxComponent, { createProps } from 'components/tsx-component';
import { Component, Prop } from 'vue-property-decorator';
import { EditMenu } from '../util/menus/EditMenu';
import { AudioSource } from '../services/audio';
import { CustomizationService } from 'services/customization';
import { SliderInput } from 'components/shared/inputs/inputs';
import MixerVolmeter from './MixerVolmeter.vue';
import { Inject } from '../services/core/injector';
import { EditorCommandsService } from 'services/editor-commands';

class MixerItemProps {
  audioSource: AudioSource = null;
}

@Component({
  components: { SliderInput, MixerVolmeter },
  props: createProps(MixerItemProps),
})
export default class MixerItem extends TsxComponent<MixerItemProps> {
  @Inject() private customizationService: CustomizationService;
  @Inject() private editorCommandsService: EditorCommandsService;

  get performanceMode() {
    return this.customizationService.state.performanceMode;
  }

  get sliderMetadata() {
    return {
      min: 0,
      max: 1,
      interval: 0.01,
      displayValue: 'false',
      simpleTheme: true,
    };
  }

  setMuted(muted: boolean) {
    this.editorCommandsService.executeCommand(
      'MuteSourceCommand',
      this.props.audioSource.sourceId,
      muted,
    );
  }

  onSliderChangeHandler(newVal: number) {
    this.editorCommandsService.executeCommand(
      'SetDeflectionCommand',
      this.props.audioSource.sourceId,
      newVal,
    );
  }

  showSourceMenu(sourceId: string) {
    const menu = new EditMenu({
      selectedSourceId: sourceId,
      showAudioMixerMenu: true,
    });
    menu.popup();
  }
}
