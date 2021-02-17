import { IGoLiveSettings } from '../../../../services/streaming';
import { TSetPlatformSettingsFn } from '../go-live';
import { TagsInput, TSlobsInputProps } from '../../../shared/inputs';
import { useOnCreate, useVuex } from '../../../hooks';
import { Services } from '../../../service-provider';
import { prepareOptions, TTwitchTag } from '../../../../services/platforms/twitch/tags';
import { ITwitchStartStreamOptions } from '../../../../services/platforms/twitch';
import React from 'react';
import { keyBy, omit } from 'lodash';
import { IOption } from '../../../shared/inputs/ListInput';
import { Row, Col, Tag } from 'antd';

type TTwitchTagsInputProps = TSlobsInputProps<{}, TTwitchTag[]>;

export function TwitchTagsInput(p: TTwitchTagsInputProps) {
  const s = useOnCreate(() => {
    const state = Services.TwitchService.state;
    const avalableTags = state.availableTags;
    const disabled = !state.hasUpdateTagsPermission;
    // TODO setup a real locale
    const translatedTags = prepareOptions('en-US', avalableTags);
    const tagsMap = keyBy(translatedTags, 'tag_id');
    return { disabled, translatedTags, tagsMap };
  });

  const options = s.translatedTags.map(tag => ({
    label: tag.name,
    value: tag.tag_id,
    description: tag.description,
  }));

  function render() {
    return (
      <TagsInput
        label={p.label}
        onInput={values => p.onInput && p.onInput(values.map(tagName => s.tagsMap[tagName]))}
        value={p.value && p.value.map(tag => tag.tag_id)}
        options={options}
        tagRender={(tagProps, tag) => (
          <Tag {...tagProps} color="#9146FF">
            {tag.label}
          </Tag>
        )}
        optionRender={opt => (
          <Row gutter={8}>
            <Col span={10}>{opt.label}</Col>
            <Col span={14} style={{ whiteSpace: 'normal' }}>
              {opt.description}
            </Col>
          </Row>
        )}
      />
    );
  }
  return render();
}
