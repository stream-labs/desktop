import cx from 'classnames';
import colorPicker from 'color-picker';
import { Component, Prop } from 'vue-property-decorator';
import { Sketch } from 'vue-color';
import { BaseInput } from './BaseInput';
import { IColorMetadata } from './index';
import styles from './ColorInput.m.less';
import { $t } from 'services/i18n';

@Component({})
export default class ColorInput extends BaseInput<string, IColorMetadata> {
  @Prop() readonly value: string;
  @Prop() readonly metadata: IColorMetadata;
  @Prop() readonly title: string;

  pickerVisible = false;

  togglePicker() {
    this.pickerVisible = !this.pickerVisible;
  }

  eyedrop(e: MouseEvent) {
    e.stopPropagation();
    colorPicker.startColorPicker(
      (data: { event: string; hex: string }) => {
        if (data.event === 'mouseClick') {
          this.emitInput(`#${data.hex}`);
        }
      },
      () => {},
    );
  }

  render() {
    console.log(this.value);
    return (
      <div
        data-role="input"
        data-type="color"
        data-name={this.options.name}
        class="input-wrapper"
        style={this.metadata.fullWidth && 'width: 100%'}
      >
        <div class={styles.colorpicker}>
          <div class={styles.colorpickerText} onClick={() => this.togglePicker()}>
            <input class={styles.colorpickerInput} type="text" readonly value={this.value} />
            <i
              class="fas fa-eye-dropper"
              onClick={(e: MouseEvent) => this.eyedrop(e)}
              vTooltip={{ content: $t('Pick Screen Color'), placement: 'bottom' }}
            />
            <div class={styles.colorpickerSwatch} style={`background-color: ${this.value}`} />
          </div>
          <transition name="colorpicker-slide">
            {this.pickerVisible && (
              <div
                class={cx(styles.colorpickerContainer, {
                  [styles.hiddenAlpha]: !this.metadata.includeAlpha,
                })}
              >
                <Sketch
                  value={{ hex: this.value }}
                  onInput={(value: { hex: string; hex8: string }) =>
                    this.emitInput(this.metadata.includeAlpha ? value.hex8 : value.hex)
                  }
                  class={styles.colorpickerMenu}
                />
              </div>
            )}
          </transition>
        </div>
      </div>
    );
  }
}
