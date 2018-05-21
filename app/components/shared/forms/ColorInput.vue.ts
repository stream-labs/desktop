import _ from 'lodash';
import { Component, Watch, Prop } from 'vue-property-decorator';
import { debounce } from 'lodash-decorators';
import { TObsType, IFormInput, Input } from './Input';
import Utils from './../../../services/utils';
import VueColor from 'vue-color';

interface IColor {
  hex: string,
  a: number
}

@Component({
  components: { ColorPicker: VueColor.Sketch }
})
class ColorInput extends Input<IFormInput<number>> {

  static obsType: TObsType;

  @Prop()
  value: IFormInput<number>;

  color: IColor = {
    hex: '#ffffff',
    a: 1
  };

  pickerVisible = false;

  onChange(color: IColor) {
    this.color = color;
  }

  togglePicker() {
    this.pickerVisible = !this.pickerVisible;
  }

  @debounce(500)
  setValue() {
    const { a, hex } = this.color;
    if ((a !== this.obsColor.a) || (hex !== this.obsColor.hex)) {

      const intColor = Utils.rgbaToInt(
        parseInt(hex.substr(1, 2), 16),
        parseInt(hex.substr(3, 2), 16),
        parseInt(hex.substr(5, 2), 16),
        Math.round(255 * a),
      );
      this.emitInput({ ...this.value, value: intColor });
    }
  }

  @Watch('color')
  onColorChangeHandler() {
    this.setValue();
  }

  @Watch('obsColor')
  onObsColorChangeHandler() {
    this.color = this.obsColor;
  }

  created() {
    this.color = this.obsColor;
  }

  get hexAlpha() {
    let alpha = this.color.a;
    return _.padStart(Math.floor(alpha * 255).toString(16), 2, '0');
  }

  get hexColor() {
    return this.color.hex.substr(1);
  }

  // This is displayed to the user
  get hexARGB() {
    return ('#' + this.hexAlpha + this.hexColor).toLowerCase();
  }

  get swatchStyle() {
    return {
      backgroundColor: this.color.hex,
      opacity: this.color.a || 1
    };
  }


  get obsColor(): IColor {
    const rgba = Utils.intToRgba(this.value.value);

    const intTo2hexDigit = (int: number) => {
      let result = int.toString(16);
      if (result.length === 1) result = '0' + result;
      return result;
    };

    return {
      hex: '#' + intTo2hexDigit(rgba.r) + intTo2hexDigit(rgba.g) + intTo2hexDigit(rgba.b),
      a: Number((rgba.a / 255).toFixed(2))
    };
  }

}

ColorInput.obsType = 'OBS_PROPERTY_COLOR';

export default ColorInput;
