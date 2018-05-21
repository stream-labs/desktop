import Vue from 'vue';
import VueColor from 'vue-color';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

interface IColor {
  hex: string;
  a: number;
}

@Component({
  components: {
    ColorPicker: VueColor.Sketch
  }
})
export default class WidgetColorInput extends Vue {
  @Prop()
  value: { value: string };

  pickerVisible = false;

  togglePicker() {
    this.pickerVisible = !this.pickerVisible;
  }

  color: IColor = {
    hex: '#ffffff',
    a: 1
  };

  onChange(color: IColor) {
    this.color = color;
  }

  get hexColor() {
    return this.color.hex.substr(1);
  }

  // This is displayed to the user
  get hexARGB() {
    return ('#' + this.hexColor).toLowerCase();
  }
  get swatchStyle() {
    return {
      backgroundColor: this.color.hex,
      opacity: this.color.a || 1
    };
  }
}
