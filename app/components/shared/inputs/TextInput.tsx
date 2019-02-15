import { Component, Prop } from 'vue-property-decorator';
import cx from 'classnames';
import styles from './TextInput.m.less';
import { BaseInput } from './BaseInput';
import { ITextMetadata } from './index';
import { $t } from 'services/i18n';

@Component({})
export default class TextInput extends BaseInput<string, ITextMetadata> {
  @Prop() readonly value: string;

  @Prop({ default: () => ({}) })
  readonly metadata: ITextMetadata;

  textVisible = !this.metadata.masked;

  toggleVisible() {
    this.textVisible = !this.textVisible;
  }

  getValidations() {
    return {
      ...super.getValidations(),
      date_format: this.options.dateFormat,
      max: this.options.max,
      min: this.options.min,
      alpha_num: this.options.alphaNum,
    };
  }

  toggleVisibleButton(h: Function) {
    return (
      this.metadata.masked && (
        <button
          class={cx('button', styles.buttonInput, 'button--default')}
          onClick={this.toggleVisible}
        >
          {this.textVisible ? $t('Hide') : $t('Show')}
        </button>
      )
    );
  }

  render(h: Function) {
    return (
      <span
        class={cx(styles.textInput, { [styles.fullWidth]: this.metadata.fullWidth })}
        data-role="input"
        data-type="text"
        data-name={this.options.name}
      >
        <input
          type={this.textVisible ? 'text' : 'password'}
          placeholder={this.options.placeholder}
          value={this.value}
          onInput={(e: { target: { value: string } }) => this.emitInput(e.target.value)}
          name={this.uuid}
          v-validate={this.validate}
          disabled={this.metadata.disabled}
        />
        {this.toggleVisibleButton(h)}
        {this.$slots.default}
      </span>
    );
  }
}
