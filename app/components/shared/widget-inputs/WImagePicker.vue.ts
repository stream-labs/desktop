import { Component, Prop } from 'vue-property-decorator';
import { WInput, IWInputMetadata } from './WInput';

interface IWImagePicker extends IWInputMetadata {
  src: string;
  images: string[];
}

@Component({})
export default class WImagePicker extends WInput<string, IWImagePicker> {

  @Prop({ default: '' })
  value: string;

  @Prop({ default: {} })
  metadata: IWImagePicker;

  updateValue(value: string) {
    this.emitInput(value);
  }
}
