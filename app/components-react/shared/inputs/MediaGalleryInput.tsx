import { Modal, Upload } from 'antd';
import React, { useEffect, useState } from 'react';
import { InputComponent, TSlobsInputProps, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import { $t } from '../../../services/i18n';
import { UploadFile } from 'antd/lib/upload/interface';
import { Services } from '../../service-provider';

export const MediaGalleryInput = InputComponent((p: TSlobsInputProps<{}, string>) => {
  const { wrapperAttrs, inputAttrs } = useInput('mediagallery', p);
  const value = inputAttrs.value;

  function showMediaGallery() {
    Services.MediaGalleryService.actions.return.pickFile();
  }

  const defaultImageMetadata: UploadFile = {
    uid: '-1',
    name: '',
    status: 'done',
    url: '',
    size: 0,
    type: '',
  };

  const isVideo = /\.webm/.test(inputAttrs.value);
  const mediaStyle: React.CSSProperties = {
    maxHeight: '110px',
    width: 'auto',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };

  return (
    <InputWrapper {...wrapperAttrs}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '300px',
          height: '120px',
          backgroundColor: 'var(--section)',
        }}
        onClick={showMediaGallery}
      >
        {isVideo && (
          <video loop muted autoPlay style={mediaStyle}>
            <source src={value} type="video/webm" />
          </video>
        )}
        {!isVideo && <img src={value} style={mediaStyle} />}
      </div>
    </InputWrapper>
  );
});
