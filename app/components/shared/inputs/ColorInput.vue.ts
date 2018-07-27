import { Component, Prop } from 'vue-property-decorator';
import VueColor from 'vue-color';
import { BaseInput } from './BaseInput';
import { IInputMetadata } from './index';


@Component({
  components: { ColorPicker: VueColor.Sketch }
})
export default class ColorInput extends BaseInput<string, IInputMetadata> {


  @Prop() value: string;
  @Prop() metadata: IInputMetadata;

  pickerVisible = false;

  togglePicker() {
    this.pickerVisible = !this.pickerVisible;
  }

  get swatchStyle() {
    return {
      backgroundColor: this.value
    };
  }


}
