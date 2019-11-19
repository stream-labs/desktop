import { Component, Prop } from 'vue-property-decorator';
import { Sketch } from 'vue-color';
import { BaseInput } from './BaseInput';
import { IInputMetadata } from './index';

@Component({})
export default class ColorInput extends BaseInput<string, IInputMetadata> {
  @Prop() readonly value: string;
  @Prop() readonly metadata: IInputMetadata;
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

  render() {
    return (
      <div data-role="input" data-type="color" data-name={this.options.name}>
        <div class="input-wrapper">
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
                    onInput={(value: { hex: string }) => this.emitInput(value.hex)}
                    class="colorpicker-menu"
                  />
                </div>
              )}
            </transition>
          </div>
        </div>
      </div>
    );
  }
}
