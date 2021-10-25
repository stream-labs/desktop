import { InputComponent, TSlobsInputProps, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import css from './mediaUrlInput.m.less';
import React from 'react';
import { MediaInputButtons } from './MediaUrlInput';

export const AudioUrlInput = InputComponent((p: TSlobsInputProps<{}, string>) => {
  const { wrapperAttrs, inputAttrs } = useInput('audiourl', p);

  return (
    <InputWrapper {...wrapperAttrs}>
      <div className={css.audioInput}>
        <MediaInputButtons value={inputAttrs.value} onChange={inputAttrs.onChange} isAudio />
      </div>
    </InputWrapper>
  );
});
