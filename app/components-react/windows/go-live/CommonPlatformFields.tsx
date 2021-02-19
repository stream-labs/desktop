import { TPlatform } from '../../../services/platforms';
import { IGoLiveSettings, IStreamSettings } from '../../../services/streaming';
import { Services } from '../../service-provider';
import { useOnCreate } from '../../hooks';
import { pick, cloneDeep } from 'lodash';
import { $t } from '../../../services/i18n';
import { Form } from 'antd';
import React, { useState } from 'react';
import { CheckboxInput, TextAreaInput, TextInput } from '../../shared/inputs';
import { IGoLiveProps, getEnabledPlatforms, TUpdatePlatformSettingsFn } from './go-live';
import Utils from '../../../services/utils';
import { assertIsDefined } from '../../../util/properties-type-guards';
import InputWrapper from '../../shared/inputs/InputWrapper';
import { createBinding } from '../../shared/inputs/inputs';
import Animate from 'rc-animate';

interface IProps {
  /**
   * if provided then change props only for the provided platform
   */
  platform?: TPlatform;
  settings: IGoLiveSettings;
  updatePlatformSettings: TUpdatePlatformSettingsFn;
}

type TCustomFieldName = 'title' | 'description';

/**
 * Component for modifying common platform fields such as "Title" and "Description"
 * if "props.platform" is provided it changes props for a single platform
 * otherwise it changes props for all enabled platforms
 */
export default function CommonPlatformFields(p: IProps) {
  const { settings, updatePlatformSettings } = p;
  const { StreamingService } = Services;
  const view = StreamingService.views;
  const targetPlatforms = getTargetPlatforms(p);
  const enabledPlatforms = getEnabledPlatforms(settings);
  const platformSettings = getPlatformSettings(p);
  const [commonFields, setCommonFields] = useState(
    () =>
      pick(p.platform ? settings.platforms[p.platform] : view.getCommonFields(settings.platforms), [
        'title',
        'description',
      ]) as { title: string; description: string },
  );

  /**
   * Update the selected field for all target platforms
   **/
  function updateCommonField(fieldName: TCustomFieldName, value: string) {
    setCommonFields({ ...commonFields, [fieldName]: value });
    targetPlatforms.forEach(platform => {
      updatePlatformSettings(platform, commonFields);
    });
  }

  /**
   * Toggle the "Use different title... " checkbox
   **/
  function toggleUseCustom() {
    // this method is applicable only for a single platform component's mode
    const platform = p.platform;
    assertIsDefined(platform);

    // update platforms settings
    const platformSettings = settings.platforms[platform];
    updatePlatformSettings(platform, { useCustomFields: !platformSettings.useCustomFields });
  }

  const isSinglePlatformMode = !!p.platform;
  const hasCustomCheckbox =
    isSinglePlatformMode && settings.advancedMode && enabledPlatforms.length > 1;
  const fieldsAreVisible = !hasCustomCheckbox || platformSettings?.useCustomFields;
  const hasDescription = isSinglePlatformMode
    ? view.supports('description', [p.platform as TPlatform])
    : view.supports('description');
  const fields = isSinglePlatformMode ? settings.platforms[p.platform as TPlatform] : commonFields;

  // find out the best title for common fields
  const title = hasDescription
    ? $t('Use different title and description')
    : $t('Use different title');

  return (
    <div>
      {/* USE CUSTOM CHECKBOX */}
      {hasCustomCheckbox && (
        <InputWrapper>
          <CheckboxInput
            name="customEnabled"
            value={!!platformSettings?.useCustomFields}
            onChange={toggleUseCustom}
            label={title}
          />
        </InputWrapper>
      )}

      <Animate transitionName="slidedown">
        {fieldsAreVisible && (
          <div>
            {/*TITLE*/}
            <TextInput
              value={fields.title}
              name="title"
              onChange={val => updateCommonField('title', val)}
              label={$t('Title')}
              required={true}
              // TODO:
              // max: this.props.platform === 'twitch' ? 140 : 120,
            />

            {/*DESCRIPTION*/}
            {hasDescription && (
              <TextAreaInput
                value={fields['description']}
                onChange={val => updateCommonField('description', val)}
                name="description"
                label={$t('Description')}
              />
            )}
          </div>
        )}
      </Animate>
    </div>
  );
}

/**
 * Returns platforms that we should apply settings to
 **/
function getTargetPlatforms(props: IProps): TPlatform[] {
  // component in the single platform mode
  // just return "props.platform"
  if (props.platform) return [props.platform];

  // component in the simple multiplatform mode
  // return all enabled platforms
  if (!props.settings.advancedMode) {
    return getEnabledPlatforms(props.settings);
  }

  // component in the advanced multiplatform mode
  // return platforms with "useCustomFields=false"
  return getEnabledPlatforms(props.settings).filter(
    platform => !props.settings.platforms[platform].useCustomFields,
  );
}

/**
 * Returns platform settings for a single-platform mode
 **/
function getPlatformSettings(props: IProps) {
  if (!props.platform) return null;
  return props.settings.platforms[props.platform];
}
