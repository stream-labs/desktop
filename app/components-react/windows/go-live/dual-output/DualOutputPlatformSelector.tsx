import React, { useRef, useMemo } from 'react';
import { $t } from 'services/i18n';
import { TPlatform, platformLabels } from 'services/platforms';
import { useGoLiveSettings } from '../useGoLiveSettings';
import { Select } from 'antd';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import { Services } from 'components-react/service-provider';
import styles from './DualOutputGoLive.m.less';
import { ICustomStreamDestination } from 'services/settings/streaming';
import cx from 'classnames';

const { Option } = Select;

interface IPlatformSelectorProps {
  togglePlatform: (platform: TPlatform) => void;
  platforms?: TPlatform[];
}

/**
 * Render platform selector
 */

export default function DualOutputPlatformSelector(p: IPlatformSelectorProps) {
  const {
    linkedPlatforms,
    enabledPlatforms,
    customDestinations,
    switchCustomDestination,
  } = useGoLiveSettings();
  const enabledPlatformsRef = useRef<TPlatform[]>(enabledPlatforms);
  enabledPlatformsRef.current = enabledPlatforms;

  function showStreamSettings() {
    Services.SettingsService.actions.showSettings('Stream');
  }

  const displayed = useMemo(() => {
    return linkedPlatforms.filter(platform => !enabledPlatforms.includes(platform));
  }, [linkedPlatforms, enabledPlatforms]);

  const displayedPlatforms = useMemo(() => {
    const notEnabledPlatforms: string[] = linkedPlatforms.filter(
      // platform => !p.platforms?.includes(platform),
      // platform => !enabledPlatformsRef.current.includes(platform),
      platform => !isEnabled(platform),
    );
    const notEnabledDestinations: string[] = customDestinations.reduce(
      (destinations: string[], destination: ICustomStreamDestination) => {
        if (!destination.enabled) {
          destinations.push(destination.name);
        }
        return destinations;
      },
      [],
    );
    return notEnabledPlatforms.concat(notEnabledDestinations);
  }, [linkedPlatforms, p.platforms, enabledPlatforms]);

  function isEnabled(platform: TPlatform) {
    return enabledPlatforms.includes(platform);
  }

  function formatOptions() {
    const platforms = linkedPlatforms
      .filter(platform => !isEnabled(platform as TPlatform))
      .map(platform => ({
        value: platform as string,
        label: (
          <>
            <PlatformLogo
              platform={platform as TPlatform}
              className={styles.selectorIcon}
              trovo={platform === 'trovo'}
              nocolor
            />
            {platformLabels(platform)}
          </>
        ),
      }));

    const destinations = customDestinations.map((destination: ICustomStreamDestination) => ({
      value: destination.name,
      label: (
        <>
          <i className={cx(styles.icon, 'fa fa-globe')} />
          {destination.name}
        </>
      ),
    }));

    return platforms.concat(destinations);
  }

  // const options = formatOptions();

  const options = useMemo(() => {
    return formatOptions();
  }, [linkedPlatforms, enabledPlatforms, customDestinations]);

  // // The first value of the selector does not change
  const defaultLabel = [
    {
      value: 'default',
      label: (
        <div>
          <i className={cx('icon-add', styles.icon)} />
          {'Add Destination'}
        </div>
      ),
    },
  ];

  return (
    <Select
      defaultValue={defaultLabel[0]}
      className={styles.platformsSelector}
      onChange={(option: { value: string; label: React.ReactNode }) => {
        if (option.value === 'add') {
          // navigate to stream settings
          showStreamSettings();
        } else {
          // add destination to switchers
          if (linkedPlatforms.includes(option.value as TPlatform)) {
            p.togglePlatform(option.value as TPlatform);
            enabledPlatformsRef.current = enabledPlatformsRef.current.filter(
              platform => platform !== option.value,
            );
          } else {
            customDestinations.forEach((destination: ICustomStreamDestination, index: number) => {
              if (destination.name === option.value) {
                switchCustomDestination(index, true);
              }
            });
          }
        }
      }}
      labelInValue
      value={defaultLabel[0]}
    >
      {options.map(option => (
        <Option key={option.value} value={option.value ?? ''}>
          {option.label}
        </Option>
      ))}
      <Option key="add" value="add" className={styles.optionBtn}>
        <i className={cx('icon-add-circle', styles.selectorIcon)} />
        {$t('Other')}
      </Option>
    </Select>
  );
}
