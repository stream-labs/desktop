import cx from 'classnames';
import { Component, Prop } from 'vue-property-decorator';
import { EInputType, IInputMetadata } from './index';
import FormInput from './FormInput.vue';
import BaseFormGroup from './BaseFormGroup';
import styles from './InputWrapper.m.less';

@Component({})
export default class InputWrapper extends BaseFormGroup {
  @Prop()
  readonly type: EInputType;

  @Prop()
  readonly value: undefined;

  @Prop()
  readonly metadata: IInputMetadata;

  @Prop()
  readonly title: string;

  created() {
    super.created();
  }

  render() {
    return (
      <div class={cx(styles.row, 'alignable-input')}>
        <label class={styles.inputLabel}>{this.options.title}</label>
        <div class={styles.inputBody}>
          <div class={cx(styles.inputContainer, styles.inputContainerNoMargin)}>
            {!this.$slots.default && (
              <FormInput
                value={this.value}
                metadata={this.formInputMetadata}
                onInput={(value: unknown, event: InputEvent) => this.emitInput(value, event)}
              />
            )}
            {this.$slots.default && <div class={styles.slots}>{this.$slots.default}</div>}
            {this.options.tooltip && (
              <div class={styles.tooltip}>
                <i class="icon-question icon-btn" vTooltip={this.metadata.tooltip} />
              </div>
            )}
          </div>

          {(this.options.description || !!this.inputErrors.length) && (
            <div class={styles.inputFooter}>
              {this.options.description && !this.inputErrors.length && (
                <div class={styles.whisper}>{this.options.description}</div>
              )}
              {!!this.inputErrors.length && (
                <div class={styles.inputError}>{this.inputErrors[0].msg}</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}
