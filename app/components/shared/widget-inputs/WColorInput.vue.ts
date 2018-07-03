import { Component, Prop } from 'vue-property-decorator';
import VueColor from 'vue-color';
import { WInput } from './WInput';


@Component({
  components: { ColorPicker: VueColor.Sketch }
})
export default class WColorInput extends WInput<string, {}> {


  @Prop()
  value: string;

  pickerVisible = false;

  togglePicker() {
    this.pickerVisible = !this.pickerVisible;
  }

  mounted() {

  }

  get swatchStyle() {
    return {
      backgroundColor: this.value
    };
  }


}
