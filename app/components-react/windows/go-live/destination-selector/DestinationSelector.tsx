import React, { useMemo } from 'react';
import { $t } from 'services/i18n';
import { TPlatform, platformLabels } from 'services/platforms';
import { useGoLiveSettings } from '../useGoLiveSettings';
import { Select } from 'antd';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import { Services } from 'components-react/service-provider';
import styles from './DestinationSelector.m.less';
import { ICustomStreamDestination } from 'services/settings/streaming';
import cx from 'classnames';

const { Option } = Select;

interface IPlatformSelectorProps {
  showSwitcher: (platform: TPlatform) => void;
  switchDestination: (index: number) => void;
  togglePlatform: (platform: TPlatform) => void;
}

/**
 * Render platform selector
 */

export default function DestinationSelector(p: IPlatformSelectorProps) {
  const {
    linkedPlatforms,
    shouldAddTikTok,
    enabledPlatforms,
    customDestinations,
    isEnabled,
  } = useGoLiveSettings().extend(module => {
    return {
      get shouldAddTikTok() {
        return !module.isPlatformLinked('tiktok');
      },
    };
  });

  function showStreamSettings() {
    Services.SettingsService.actions.showSettings('Stream');
  }

  // force tiktok to always show as an option
  const platformTargets = shouldAddTikTok ? ['tiktok' as TPlatform] : linkedPlatforms;

  const options = useMemo(() => {
    const platforms = platformTargets
      .filter((platform: TPlatform) => !isEnabled(platform))
      .map((platform: TPlatform) => ({
        value: platform as string,
        label: (
          <>
            <PlatformLogo
              platform={platform as TPlatform}
              className={styles.selectorIcon}
              fontIcon={['tiktok', 'trovo'].includes(platform) ? platform : undefined}
            />
            {platformLabels(platform)}
          </>
        ),
      }));

    const destinations = customDestinations
      .filter(destination => !destination.enabled)
      .map((destination: ICustomStreamDestination) => ({
        value: destination.name,
        label: (
          <>
            <i className={cx(styles.selectorIcon, styles.destinationLogo, 'fa fa-globe')} />
            {destination.name}
          </>
        ),
      }));

    return platforms.concat(destinations);
  }, [linkedPlatforms, enabledPlatforms, customDestinations]);

  // The first value of the selector does not change
  const defaultLabel = [
    {
      value: 'default',
      label: (
        <div>
          <i className={cx('icon-add', styles.addIcon)} />
          {'Add Destination'}
        </div>
      ),
    },
  ];

  return (
    <Select
      data-test="do-platform-selector"
      defaultValue={defaultLabel[0]}
      className={cx(styles.dualOutputPlatformSelector)}
      onChange={(option: { value: string; label: React.ReactNode }) => {
        if (option.value === 'add' || (option.value === 'tiktok' && shouldAddTikTok)) {
          // navigate to stream settings
          showStreamSettings();
        } else {
          // add destination to switchers
          if (linkedPlatforms.includes(option.value as TPlatform)) {
            p.showSwitcher(option.value as TPlatform);
            p.togglePlatform(option.value as TPlatform);
          } else {
            customDestinations.forEach((destination: ICustomStreamDestination, index: number) => {
              if (destination.name === option.value) {
                p?.switchDestination(index);
              }
            });
          }
        }
      }}
      labelInValue
      value={defaultLabel[0]}
    >
      {options.map(option => (
        <Option key={option.value} value={option.value ?? ''} className={styles.optionBtn}>
          {option.label}
        </Option>
      ))}
      <Option key="add" value="add" className={styles.optionBtn}>
        <i className={cx('icon-add-circle', styles.optionIcon)} />
        {$t('Other')}
      </Option>
    </Select>
  );
}
