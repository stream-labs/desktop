import { TagsInput, TSlobsInputProps } from '../../../shared/inputs';
import { useOnCreate } from '../../../hooks';
import { Services } from '../../../service-provider';
import { prepareOptions, TTwitchTag } from '../../../../services/platforms/twitch/tags';
import React from 'react';
import keyBy from 'lodash/keyBy';
import { IListOption } from '../../../shared/inputs/ListInput';
import { Row, Col, Tag } from 'antd';
import { I18nService } from '../../../../services/i18n';

type TTwitchTagsInputProps = TSlobsInputProps<{}, TTwitchTag[]>;

export function TwitchTagsInput(p: TTwitchTagsInputProps) {
  const s = useOnCreate(() => {
    const state = Services.TwitchService.state;
    const avalableTags = state.availableTags;
    const disabled = !state.hasUpdateTagsPermission;
    const locale = I18nService.instance.state.locale;
    const translatedTags = prepareOptions(locale, avalableTags);
    const tagsMap = keyBy(translatedTags, 'tag_id');
    return { disabled, translatedTags, tagsMap };
  });

  const options: IListOption<string>[] = s.translatedTags.map(tag => ({
    label: tag.name,
    value: tag.tag_id,
    description: tag.description,
  }));

  function render() {
    return (
      <TagsInput
        name="twitchTags"
        label={p.label}
        value={p.value && p.value.map(tag => tag.tag_id)}
        max={5}
        onChange={values => p.onChange && p.onChange(values.map(tagName => s.tagsMap[tagName]))}
        options={options}
        tagRender={(tagProps, tag) => (
          <Tag {...tagProps} color="#9146FF">
            {tag.label}
          </Tag>
        )}
        optionRender={opt => (
          <Row gutter={8}>
            <Col span={10}>{opt.label}</Col>
            <Col span={14} style={{ whiteSpace: 'normal', fontSize: '12px' }}>
              {opt.description}
            </Col>
          </Row>
        )}
      />
    );
  }
  return render();
}
