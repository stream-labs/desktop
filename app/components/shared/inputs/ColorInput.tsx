import cx from 'classnames';
import { Component, Prop } from 'vue-property-decorator';
import { Sketch } from 'vue-color';
import { BaseInput } from './BaseInput';
import { IColorMetadata } from './index';
import styles from './ColorInput.m.less';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { UsageStatisticsService } from 'services/usage-statistics';
import { loadColorPicker } from 'util/slow-imports';
import { OS, getOS } from 'util/operating-systems';

@Component({})
export default class ColorInput extends BaseInput<string, IColorMetadata> {
  @Prop() readonly value: string;
  @Prop({ default: () => ({}) }) readonly metadata: IColorMetadata;
  @Prop() readonly title: string;
  @Inject() readonly usageStatisticsService: UsageStatisticsService;

  pickerVisible = false;

  togglePicker() {
    this.pickerVisible = !this.pickerVisible;
  }

  async eyedrop(e: MouseEvent) {
    e.stopPropagation();
    const colorPicker = (await loadColorPicker()).default;
    this.usageStatisticsService.recordFeatureUsage('screenColorPicker');
    colorPicker.startColorPicker(
      (data: { event: string; hex: string }) => {
        if (data.event === 'mouseClick') {
          this.emitInput(`#${data.hex}`);
        }
      },
      () => {},
      { onMouseMoveEnabled: true, showPreview: true, showText: false, previewSize: 35 },
    );
  }

  get pickerBody() {
    return (
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
    );
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
        <div class={styles.colorpicker}>
          <div class={styles.colorpickerText} onClick={() => this.togglePicker()}>
            <input
              class={styles.colorpickerInput}
              name="colorpicker-input"
              type="text"
              readonly
              value={this.value}
            />
            {getOS() === OS.Windows && (
              <i
                class="fas fa-eye-dropper"
                onClick={(e: MouseEvent) => this.eyedrop(e)}
                vTooltip={{ content: $t('Pick Screen Color'), placement: 'bottom' }}
              />
            )}
            <div class={styles.colorpickerSwatch} style={`background-color: ${this.value}`} />
          </div>
          {this.pickerBody}
        </div>
      </div>
    );
  }
}
