import React, { useMemo } from 'react';
import { Divider } from 'antd';
import { ListInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import { getPlatformService, TPlatform } from 'services/platforms';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import { $t } from 'services/i18n';

interface IPrimaryChatSwitcherProps {
  /** A filtered list of enabled platforms where all support chat **/
  chatPlatforms: TPlatform[];
  primaryChat: TPlatform;
  onSetPrimaryChat: (platform: TPlatform) => void;
  style?: React.CSSProperties;
  layout?: 'vertical' | 'horizontal';
}

export default function PrimaryChatSwitcher({
  chatPlatforms,
  primaryChat,
  onSetPrimaryChat,
  style = {},
  layout = 'vertical',
}: IPrimaryChatSwitcherProps) {
  const primaryChatOptions = useMemo(
    () =>
      chatPlatforms.map(platform => {
        const service = getPlatformService(platform);
        return {
          label: service.displayName,
          value: platform,
        };
      }),
    [chatPlatforms],
  );

  return (
    <div style={style}>
      <Divider style={{ marginBottom: '8px' }} />
      <Form layout={layout}>
        <ListInput
          name="primaryChat"
          label={$t('Primary Chat')}
          options={primaryChatOptions}
          labelRender={renderPrimaryChatOption}
          optionRender={renderPrimaryChatOption}
          value={primaryChat}
          onChange={onSetPrimaryChat}
        />
      </Form>
    </div>
  );
}

const renderPrimaryChatOption = (option: { label: string; value: TPlatform }) => {
  /*
   * TODO: antd's new version has a new Flex component that should make
   * spacing (`gap` here) more consistent. Also, less typing.
   * https://ant.design/components/flex
   */
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <PlatformLogo platform={option.value} size={16} />
      <div>{option.label}</div>
    </div>
  );
};
