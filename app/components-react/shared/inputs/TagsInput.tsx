import { Select, Tag } from 'antd';
import React, { useMemo, ReactElement } from 'react';
import { InputComponent, SingleType, TSlobsInputProps, useInput, ValuesOf } from './inputs';
import InputWrapper from './InputWrapper';
import { SelectProps } from 'antd/lib/select';
import { ICustomListProps, IListOption, renderOption } from './ListInput';
import { TagProps } from 'antd/lib/tag';
import { keyBy } from 'lodash';
import { $t } from '../../../services/i18n';

// select which features from the antd lib we are going to use
const ANT_SELECT_FEATURES = ['showSearch', 'loading'] as const;

interface ICustomTagsProps<TValue> extends ICustomListProps<SingleType<TValue>> {
  tagRender?: (
    tagProps: TagProps,
    tag: IListOption<SingleType<TValue>>,
  ) => ReactElement<typeof Tag>;
}

export type TTagsInputProps<TValue> = TSlobsInputProps<
  ICustomTagsProps<TValue>,
  TValue,
  SelectProps<TValue>,
  ValuesOf<typeof ANT_SELECT_FEATURES>
>;

export const TagsInput = InputComponent(<T extends any>(p: TTagsInputProps<T>) => {
  const { inputAttrs, wrapperAttrs } = useInput('tags', p);
  const options = p.options;
  const tagsMap = useMemo(() => keyBy(options, 'value'), [options]);

  function renderTag(tagProps: TagProps) {
    const tag = tagsMap[tagProps['value']];
    if (p.tagRender) {
      return p.tagRender(tagProps, tag);
    }
    return <Tag {...tagProps}>{tag.label}</Tag>;
  }

  return (
    <InputWrapper {...wrapperAttrs}>
      <Select
        {...inputAttrs}
        // search by label instead value
        optionFilterProp={'label'}
        mode={'multiple'}
        allowClear
        value={p.value as string | number}
        onChange={val => inputAttrs.onChange(val as T)}
        tagRender={renderTag}
        placeholder={$t('Start typing to search')}
      >
        {options && options.map((opt, ind) => renderOption(opt, ind, p))}
      </Select>
    </InputWrapper>
  );
});
