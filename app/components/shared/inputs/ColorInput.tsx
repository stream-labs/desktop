import colorPicker from 'color-picker';
import { Component, Prop } from 'vue-property-decorator';
import { Sketch } from 'vue-color';
import { BaseInput } from './BaseInput';
import { IColorMetadata } from './index';

interface IColor {
  r: number;
  g: number;
  b: number;
  a: number;
}
@Component({})
export default class ColorInput extends BaseInput<string | IColor, IColorMetadata> {
  @Prop() readonly value: string | IColor;
  @Prop() readonly metadata: IColorMetadata;
  @Prop() readonly title: string;

  pickerVisible = false;

  togglePicker() {
    this.pickerVisible = !this.pickerVisible;
  }

  get swatchStyle() {
    return {
      backgroundColor: this.value,
    };
  }

  get mode() {
    if (this.metadata.mode) {
      return this.metadata.mode;
    }
    return 'hex';
  }

  eyedrop() {
    colorPicker.startColorPicker((data: { event: string; hex: string }) => {
      if (data.event === 'mouseClick') {
        this.emitInput(data[this.mode]);
      }
    });
  }

  render() {
    return (
      <div
        data-role="input"
        data-type="color"
        data-name={this.options.name}
        class="input-wrapper"
        style={this.metadata.fullWidth && 'width: 100%'}
      >
        <div class="colorpicker">
          <div class="colorpicker__text" onClick={() => this.togglePicker()}>
            <input class="colorpicker__input" type="text" readonly value={this.value} />
            <div class="colorpicker__swatch" style={this.swatchStyle} />
          </div>
          <transition name="colorpicker-slide">
            {this.pickerVisible && (
              <div class="colorpicker-container">
                <Sketch
                  value={{ hex: this.value }}
                  onInput={(value: { hex: string; rgba: IColor }) =>
                    this.emitInput(value[this.mode])
                  }
                  class="colorpicker-menu"
                />
                <i class="fas fa-eye-dropper" onClick={() => this.eyedrop()} />
              </div>
            )}
          </transition>
        </div>
      </div>
    );
  }
}
