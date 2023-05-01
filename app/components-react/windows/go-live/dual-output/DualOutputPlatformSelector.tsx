import React, { useRef, useMemo } from 'react';
import { $t } from 'services/i18n';
import { TPlatform } from 'services/platforms';
import { useGoLiveSettings } from '../useGoLiveSettings';
import { Select } from 'antd';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import styles from './DualOutputGoLive.m.less';
import { ICustomStreamDestination } from 'services/settings/streaming';
import cx from 'classnames';

const { Option } = Select;

export default function DualOutputPlatformSelector() {
  const {
    linkedPlatforms,
    enabledPlatforms,
    customDestinations,
    switchPlatforms,
    switchCustomDestination,
    isPrimaryPlatform,
    componentView,
  } = useGoLiveSettings();
  const enabledPlatformsRef = useRef(enabledPlatforms);
  enabledPlatformsRef.current = enabledPlatforms;

  const displayed = useMemo(() => {
    const notEnabledPlatforms: string[] = linkedPlatforms.filter(
      platform => !enabledPlatforms.includes(platform),
    ) as string[];
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
  }, [linkedPlatforms, enabledPlatforms, customDestinations]);

  function isEnabled(platform: TPlatform) {
    return enabledPlatformsRef.current.includes(platform);
  }

  function formatOptions() {
    const platforms = linkedPlatforms
      .filter(platform => !enabledPlatforms.includes(platform))
      .map(platform => ({
        value: platform as string,
        label: (
          <>
            <PlatformLogo
              platform={platform}
              className={cx(styles[`platform-logo-${platform}`], styles.icon)}
            />
            {platform}
          </>
        ),
      }));

    const destinations = customDestinations.map(destination => ({
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

  const options = formatOptions();

  // The first value of the selector does not change
  const defaultLabel = [
    {
      value: 'default',
      label: (
        <div>
          <i className={cx('icon-add', styles.addDestinationIcon)} />
          {'Add Destination'}
        </div>
      ),
    },
  ];

  return (
    <>
      <Select
        defaultValue={defaultLabel[0]}
        className={styles.platformsDropdown}
        onChange={(value: { value: string; label: React.ReactNode }) => {
          const selectedApp = displayed.find(selected => selected === value.value);
          // add destination to switchers
          console.log('add destination');
        }}
        labelInValue
        value={defaultLabel[0]}
        disabled={!displayed.length} // or if the max number of platforms has been added
      >
        {'TEST'}
        {options.map(option => (
          <Option key={option.value} value={option.value ?? ''}>
            {option.label}
          </Option>
        ))}
        <Option key="add" value="add" className={styles.addOther}>
          <i className={cx(styles.icon, 'icon-add-circle')} /> {$t('Other')}
        </Option>
      </Select>
    </>
  );
}
