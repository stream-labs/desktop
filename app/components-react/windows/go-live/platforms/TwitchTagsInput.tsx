import { IGoLiveSettings } from '../../../../services/streaming';
import { TSetPlatformSettingsFn } from '../go-live';
import { TagsInput, TCombinedProps } from '../../../shared/inputs';
import { useOnCreate, useVuex } from '../../../hooks';
import { Services } from '../../../service-provider';
import { prepareOptions, TTwitchTag } from '../../../../services/platforms/twitch/tags';
import { ITwitchStartStreamOptions } from '../../../../services/platforms/twitch';
import React from 'react';
import { keyBy, omit } from 'lodash';

interface IDataProps {
  twitchSettings: ITwitchStartStreamOptions;
  setPlatformSettings: TSetPlatformSettingsFn;
}

type TTwitchTagsInputProps = TCombinedProps<IDataProps, TTwitchTag[]>;

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

  const options = s.translatedTags.map(tag => ({ label: tag.name, value: tag.tag_id, data: tag }));

  // exclude custom props from props object for TagsInput
  const customProps: (keyof TTwitchTagsInputProps)[] = ['twitchSettings', 'setPlatformSettings'];
  const tagsInputProps = omit(p, customProps);

  function render() {
    return <TagsInput {...tagsInputProps} options={options} onInput={onInputHandler} />;
  }

  function onInputHandler(values: string[]) {
    p.onInput && p.onInput(values.map(tagId => s.tagsMap[tagId]));
  }

  return render();
}
