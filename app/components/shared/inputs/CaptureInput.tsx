import cx from 'classnames';
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { ICaptureSourceMetadata } from './index';
import styles from './CaptureInput.m.less';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { UsageStatisticsService } from 'services/usage-statistics';

@Component({})
export default class CaptureInput extends BaseInput<string, ICaptureSourceMetadata> {
  @Prop() readonly value: string;
  @Prop({ default: () => ({}) }) readonly metadata: ICaptureSourceMetadata;
  @Prop() readonly title: string;

  pickerVisible = false;

  togglePicker() {
    this.pickerVisible = !this.pickerVisible;
  }

  get pickerBody() {
    return (
      <transition name="capturesource-slide">
        {this.pickerVisible && (
          <div
            class={cx(styles.captureSourceContainer, { })}
          >
          {/* list of windows goes here */}
          </div>
        )}
      </transition>
    );
  }

  render() {
    return (
      <div
        data-role="input"
        data-type="capturesource"
        data-name={this.options.name}
        class="input-wrapper"
        style={this.metadata.fullWidth && 'width: 100%'}
      >
        <div class={styles.captureSource}>
          <div class={styles.captureSourceText} onClick={() => this.togglePicker()}>
            <input
              class={styles.captureSourceInput}
              name="capturesource-input"
              type="text"
              readonly
              value={this.value}
            />
            
            <div class={styles.captureSourceSwatch} style={`background-color: ${this.value}`} />
          </div>
          {this.pickerBody}
        </div>
      </div>
    );
  }
}
