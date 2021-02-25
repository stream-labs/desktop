import { Select, Tag } from 'antd';
import React, { useContext, ReactNode, useMemo, ReactElement } from 'react';
import { InputComponent, TSlobsInputProps, useInput, ValuesOf } from './inputs';
import InputWrapper from './InputWrapper';
import { SelectProps } from 'antd/lib/select';
import { ICustomListProps, IListOption, renderOption } from './ListInput';
import { TagProps } from 'antd/lib/tag';
import { keyBy } from 'lodash';

// select which features from the antd lib we are going to use
const ANT_SELECT_FEATURES = ['showSearch', 'loading'] as const;

interface ICustomTagsProps extends ICustomListProps {
  tagRender?: (tagProps: TagProps, tag: IListOption) => ReactElement<typeof Tag>;
}

export type TTagsInputProps = TSlobsInputProps<
  ICustomTagsProps,
  string[],
  SelectProps<string>,
  ValuesOf<typeof ANT_SELECT_FEATURES>
>;

export const TagsInput = InputComponent((p: TTagsInputProps) => {
  const { inputAttrs, wrapperAttrs } = useInput('tags', p);
  const options = p.options;
  const tagsMap = useMemo(() => keyBy(options, 'value'), [options]);

  function render() {
    return (
      <InputWrapper {...wrapperAttrs}>
        <Select
          {...inputAttrs}
          // search by label instead value
          optionFilterProp={'label'}
          mode={'multiple'}
          allowClear
          onChange={(val: string[]) => p.onChange && p.onChange(val)}
          tagRender={renderTag}
        >
          {options && options.map((opt, ind) => renderOption(opt, ind, p))}
        </Select>
      </InputWrapper>
    );
  }

  function renderTag(tagProps: TagProps) {
    const tag = tagsMap[tagProps['value']];
    if (p.tagRender) {
      return p.tagRender(tagProps, tag);
    }
    return <Tag {...tagProps}>{tag.label}</Tag>;
  }

  return render();
});
