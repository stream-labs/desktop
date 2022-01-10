import React from 'react';
import cx from 'classnames';
import styles from './ImagePickerInput.m.less';
import { IListOption } from './ListInput';
import { InputComponent } from './inputs';

interface IImagePickerProps {
  options: IListOption<string>[];
  value: string;
  onInput: (value: string) => void;
  isIcons?: boolean;
}

export const ImagePickerInput = InputComponent((p: IImagePickerProps) => {
  return (
    <div className={styles.widgetLayoutPicker}>
      {p.options.map(option => (
        <div
          key={option.value}
          className={cx(styles.widgetLayoutPickerOption, {
            [styles.active]: option.value === p.value,
          })}
          onClick={() => p.onInput(option.value)}
        >
          {!p.isIcons && <img src={option.label} />}
          {p.isIcons && <i className={option.label} />}
        </div>
      ))}
    </div>
  );
});
