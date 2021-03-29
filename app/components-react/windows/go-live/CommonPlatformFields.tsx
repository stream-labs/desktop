import { TPlatform } from '../../../services/platforms';
import { IGoLiveSettings, IStreamSettings } from '../../../services/streaming';
import { Services } from '../../service-provider';
import { useOnCreate } from '../../hooks';
import { pick, cloneDeep } from 'lodash';
import { $t } from '../../../services/i18n';
import { Form } from 'antd';
import React, { useState } from 'react';
import { CheckboxInput, TextAreaInput, TextInput } from '../../shared/inputs';
import {
  IGoLiveProps,
  getEnabledPlatforms,
  TUpdatePlatformSettingsFn,
  useGoLiveSettings,
} from './useGoLiveSettings';
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
  // settings: IGoLiveSettings;
  // updatePlatformSettings: TUpdatePlatformSettingsFn;
}

type TCustomFieldName = 'title' | 'description';

/**
 * Component for modifying common platform fields such as "Title" and "Description"
 * if "props.platform" is provided it changes props for a single platform
 * otherwise it changes props for all enabled platforms
 */
export default function CommonPlatformFields(p: IProps) {
  const {
    updatePlatform,
    isAdvancedMode,
    getPlatformSettings,
    commonFields,
    updateCommonFields,
    toggleCustomFields,
    isMultiplatformMode,
    supports,
  } = useGoLiveSettings();
  const shouldShowPropsForSinglePlatform = !!p.platform;
  const platformSettings = shouldShowPropsForSinglePlatform
    ? getPlatformSettings(p.platform!)
    : null;

  /**
   * Toggle the "Use different title and description " checkbox
   **/
  function toggleUseCustom() {
    assertIsDefined(p.platform);
    toggleCustomFields(p.platform);
  }

  function updateCommonField(fieldName: TCustomFieldName, value: string) {
    if (shouldShowPropsForSinglePlatform) {
      assertIsDefined(p.platform);
      updatePlatform(p.platform, { [fieldName]: value });
    } else {
      updateCommonFields(fieldName, value);
    }
  }

  const hasCustomCheckbox =
    shouldShowPropsForSinglePlatform && isAdvancedMode && isMultiplatformMode;
  const fieldsAreVisible = !hasCustomCheckbox || platformSettings?.useCustomFields;
  const hasDescription = shouldShowPropsForSinglePlatform
    ? supports('description', [p.platform as TPlatform])
    : supports('description');
  const fields = shouldShowPropsForSinglePlatform
    ? getPlatformSettings(p.platform as TPlatform)
    : commonFields;

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
