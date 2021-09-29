import React from 'react';
import { InputComponent, TSlobsInputProps, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import { Services } from '../../service-provider';
import {
  LinkOutlined,
  CloseOutlined,
  CloudDownloadOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import { Button, Input } from 'antd';
import css from './MediaGalleryInput.m.less';
import { $t } from '../../../services/i18n';
import cx from 'classnames';
import { promptAsync } from '../../modals';

export const MediaGalleryInput = InputComponent(
  (p: TSlobsInputProps<{ isAudio?: boolean }, string>) => {
    const { wrapperAttrs, inputAttrs } = useInput('mediagallery', p);
    const value = inputAttrs.value;

    async function pickFromGallery() {
      const file = await Services.MediaGalleryService.actions.return.pickFile();
      inputAttrs.onChange(file.href);
    }

    async function showLink() {
      const newUrl = await promptAsync(
        {
          title: $t('Media URL'),
          placeholder: 'https://yoururl.com/image/Streamlabs',
        },
        value,
      );
      inputAttrs.onChange(newUrl);
    }

    function remove() {
      inputAttrs.onChange('');
    }

    function play() {
      alert('Not implemented');
    }

    const isAudio = p.isAudio;
    const isVideo = !isAudio && /\.webm/.test(inputAttrs.value);
    const isImage = !isAudio && !isVideo;
    const fileName = value ? value.split(/(\\|\/)/g).pop() : '';

    function renderButtons() {
      return (
        <span>
          <div className={css.actions}>
            <Button onClick={showLink} title={$t('Link')}>
              <LinkOutlined />
            </Button>
            <Button onClick={remove} title={$t('Remove')}>
              <CloseOutlined style={{ color: 'var(--warning)' }} />
            </Button>
            <Button onClick={pickFromGallery} title={$t('Media Gallery')}>
              <CloudDownloadOutlined />
            </Button>
          </div>

          {isAudio && (
            <Button onClick={play} title={$t('Play Audio')} className={css.playButton}>
              <CaretRightOutlined />
            </Button>
          )}
        </span>
      );
    }

    return (
      <InputWrapper {...wrapperAttrs}>
        <div
          className={cx({
            [css.mediaInput]: true,
            [css.mediaInputVisual]: !isAudio,
            [css.mediaInputAudio]: isAudio,
          })}
        >
          {isVideo && (
            <div>
              <video loop muted autoPlay className={css.media}>
                <source src={value} type="video/webm" />
              </video>
            </div>
          )}
          {isImage && <img src={value} className={css.media} />}

          {(isVideo || isImage) && (
            <div className={css.buttons}>
              <Input value={fileName} addonAfter={renderButtons()} />
            </div>
          )}

          {isAudio && (
            <div className={css.buttons}>
              <Input value={fileName} addonAfter={renderButtons()} />
            </div>
          )}
        </div>
      </InputWrapper>
    );
  },
);
