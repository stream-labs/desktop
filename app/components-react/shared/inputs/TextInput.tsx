import { ITextMetadata } from '../../../components/shared/inputs';
import styles from '../../../components/shared/inputs/TextInput.m.less';
import React from 'react';
import cx from 'classnames';

type ITextInputProps = ITextMetadata & { value: string };

export function TextInput(props: ITextInputProps) {
  return (
    <span
      className={cx(styles.textInput, {
        [styles.fullWidth]: this.metadata.fullWidth,
        [styles.disabled]: this.metadata.disabled,
      })}
      data-role="input"
      data-type="text"
      data-name={this.options.name}
      data-title={this.options.title}
    >
      {this.options.icon && <i class={`fa fa-${this.options.icon}`} />}
      <input
        type={this.textVisible ? 'text' : 'password'}
        placeholder={this.options.placeholder}
        value={this.value}
        onInput={(e: { target: { value: string } }) => this.handleInput(e.target.value)}
        onChange={(e: { target: { value: string } }) => this.handleChange(e.target.value)}
        name={this.options.uuid}
        v-validate={this.validate}
        disabled={this.options.disabled}
        onFocus={() => this.$emit('focus')}
        onBlur={() => this.$emit('blur')}
      />
      {this.toggleVisibleButton}
      {this.$slots.default}
    </span>
  );
}
