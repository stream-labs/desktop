import React from 'react';
import cx from 'classnames';
import { InputComponent, TSlobsInputProps, useInput } from './inputs';
import styles from 'components/shared/inputs/BoolButtonInput.m.less';

interface IBoolButtonInputCustomProps {
  checkboxStyles: { [key: string]: any };
  checkboxActiveStyles: { [key: string]: any };
}

export type TBoolButtonInputProps = TSlobsInputProps<IBoolButtonInputCustomProps, boolean>;

export const BoolButtonInput = InputComponent((p: TBoolButtonInputProps) => {
  let customStyles = { ...p.checkboxStyles };

  if (p.value) {
    customStyles = {
      ...customStyles,
      ...p.checkboxActiveStyles,
    };
  }

  function handleClick(e: React.MouseEvent) {
    if (p.disabled) return;
    if (p.onChange) p.onChange(!p.value);
  }

  return (
    <div
      className={cx('input-wrapper', { disabled: p.disabled })}
      data-role="input"
      data-type="toggle"
      data-value={!!p.value}
      data-name={p.name}
    >
      <div
        className={cx(styles.boolButton, { [styles.active]: !!p.value })}
        style={customStyles}
        onClick={handleClick}
      >
        {p.value && <i className="fa fa-check"></i>}
      </div>
    </div>
  );
});
