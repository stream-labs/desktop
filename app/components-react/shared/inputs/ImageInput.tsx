import { Input, Upload, UploadProps, Modal } from 'antd';
import { RcFile, UploadChangeParam, UploadFile, UploadFileStatus } from 'antd/lib/upload/interface';
import React, { useEffect, useRef, useState } from 'react';
import { InputComponent, TSlobsInputProps, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import { assertIsDefined } from '../../../util/properties-type-guards';
import { $t } from '../../../services/i18n';
import { alert } from '../../modals';
import Utils from '../../../services/utils';

export type TImageInputProps = TSlobsInputProps<{ maxFileSize: number }, string, UploadProps>;

/**
 * Allows to select an image file from FS
 * Keeps it's content in the base64 format as an input value
 */
export const ImageInput = InputComponent((p: TImageInputProps) => {
  const { inputAttrs, wrapperAttrs } = useInput('image', p);
  const [isPreviewVisible, setPreviewVisible] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // stretch the image preview on 100%
    elRef.current?.parentNode
      ?.querySelectorAll<HTMLElement>(
        '.ant-upload-list-picture-card-container,.ant-upload-select-picture-card',
      )
      ?.forEach(el => (el.style.width = '100%'));
  });

  const defaultFileInfo: UploadFile = {
    uid: '-1',
    name: '',
    status: 'done',
    url: '',
    size: 0,
    type: '',
  };

  const [fileInfo, setFileInfo] = useState({ ...defaultFileInfo, url: p.value });

  // check if the value has been changed
  useEffect(() => {
    if (fileInfo.url === p.value) return;
    setFileInfo({ ...defaultFileInfo, url: p.value });
  }, [p.value]);

  async function onPreviewHandler(file: UploadFile) {
    if (!file.url && !file.preview) {
      assertIsDefined(file.originFileObj);
      file.preview = await getBase64(file!.originFileObj);
    }
    setPreviewVisible(true);
  }

  function onBeforeUploadHandler(file: RcFile): boolean {
    let error = '';
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      error = $t('Only .jpeg and .png is supported');
    } else if (file.size > p.maxFileSize) {
      error = $t('Maximum file size reached ') + Utils.getReadableFileSizeString(p.maxFileSize);
    }
    if (error) {
      alert(error);
      // a hack for removing this file from the list
      // @see https://ant.design/components/upload/#components-upload-demo-upload-png-only
      return Upload.LIST_IGNORE as boolean;
    }

    getBase64(file).then(previewImage => {
      setFileInfo({ ...defaultFileInfo, ...file, url: previewImage });
      inputAttrs.onChange(previewImage);
    });
    return true;
  }

  function onRemoveHandler() {
    setPreviewVisible(false);
    inputAttrs.onChange('');
  }

  return (
    <InputWrapper {...wrapperAttrs}>
      <Upload
        {...inputAttrs}
        accept="image/png, image/jpeg"
        listType="picture-card"
        fileList={(fileInfo.url && [fileInfo]) || []}
        beforeUpload={onBeforeUploadHandler}
        onPreview={onPreviewHandler}
        onRemove={onRemoveHandler}
        // don't send any http requests
        customRequest={() => null}
        onChange={() => null}
      >
        {!p.value && '+ Upload'}
      </Upload>
      <Modal
        visible={isPreviewVisible}
        title={$t('Preview')}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="example" style={{ width: '100%' }} src={p.value} />
      </Modal>
      <div ref={elRef} />
    </InputWrapper>
  );
});

function getBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
