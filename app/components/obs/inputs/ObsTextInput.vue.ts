import { Component, Prop } from 'vue-property-decorator';
import { IObsInput, TObsType, ObsInput } from './ObsInput';
import { TextInput, TextAreaInput } from 'components/shared/inputs/inputs';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { ITextMetadata, ITextAreaMetadata } from 'components/shared/inputs';

@Component({
  components: { TextInput, TextAreaInput, HFormGroup },
})
class ObsTextInput extends ObsInput<IObsInput<string>> {
  static obsType: TObsType[];

  @Prop()
  value: IObsInput<string>;

  get metadata(): ITextMetadata | ITextAreaMetadata {
    return {
      name: this.value.name,
      masked: this.value.masked,
      disabled: this.value.enabled === false,
      rows: 4,
      fullWidth: true,
      // For URLs we only emit on change when the user is done typing to
      // avoid loading any intermediate URLs
      emitOnChange: this.value.name === 'url',
    };
  }

  onInputHandler(value: string) {
    this.emitInput({ ...this.value, value });
  }
}

ObsTextInput.obsType = ['OBS_PROPERTY_EDIT_TEXT', 'OBS_PROPERTY_TEXT'];

export default ObsTextInput;
