import { AnchorPoint } from '../../util/ScalableRectangle';
import { $t } from '../i18n';
import { TPlatform } from '../platforms';

export type TWidgetType = 'AlertBox' | 'ViewerCount';
export type TAlertType = 'donation' | 'follow' | 'subscription' | 'cheer' | 'host';

export interface IWidgetTypeInfo {
  type: TWidgetType;
  name: string;
  description: string;
  demoVideo: boolean;
  demoFilename: string;
  supportList: string[];

  // Default transform for the widget
  defaultTransform: {
    width: number;
    height: number;

    // These are relative, so they will adjust to the
    // canvas resolution.  Valid values are between 0 and 1.
    x: number;
    y: number;

    // An anchor (origin) point can be specified for the x&y positions
    anchor: AnchorPoint;
  };

  url: string;
  dataFetchUrl: string;
  settingsSaveUrl: string;
  previewUrl: string;
  settingsUpdateEvent: string;
  testers?: TAlertType[];
  customCodeAllowed?: boolean;
  customFieldsAllowed?: boolean;

  // the settings window size
  // the default size is 600x800
  settingsWindowSize?: {
    width: number;
    height: number;
  };
}

export function getWidgetsInfo(host: string, token: string): Record<TWidgetType, IWidgetTypeInfo> {
  return {
    AlertBox: {
      type: 'AlertBox',
      name: $t('Alertbox'),
      description: $t('Thanks viewers with notification popups.'),
      demoVideo: true,
      demoFilename: 'source-alertbox.mp4',
      supportList: [$t('Donations'), $t('Subscriptions'), $t('Follows'), $t('Bits'), $t('Hosts')],

      defaultTransform: {
        width: 800,
        height: 600,
        x: 0.5,
        y: 0,
        anchor: AnchorPoint.North,
      },

      settingsWindowSize: {
        width: 920,
        height: 1024,
      },

      url: `https://${host}/alert-box/v3/${token}`,
      previewUrl: `https://${host}}/alert-box/v3/${token}`,
      dataFetchUrl: `https://${host}/api/v5/slobs/widget/alertbox?include_linked_integrations_only=true&primary_only=false`,
      settingsSaveUrl: `https://${host}/api/v5/slobs/widget/alertbox`,
      settingsUpdateEvent: 'filteredAlertBoxSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: true,
    },

    ViewerCount: {
      type: 'ViewerCount',
      name: $t('Viewer Count'),
      description: $t('Show off your viewers from multiple platforms.'),
      demoVideo: false,
      demoFilename: 'source-viewer-count.png',
      supportList: ['YouTube', 'Twitch', 'Facebook'],
      url: `https://${host}/widgets/viewer-count?token=${token}`,

      defaultTransform: {
        width: 600,
        height: 200,
        x: 0,
        y: 1,
        anchor: AnchorPoint.SouthWest,
      },

      previewUrl: `https://${host}/widgets/viewer-count?token=${token}&simulate=1`,
      dataFetchUrl: `https://${host}/api/v5/slobs/widget/viewercount`,
      settingsSaveUrl: `https://${host}/api/v5/slobs/widget/viewercount`,
      settingsUpdateEvent: 'viewerCountSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: true,
    },
  };
}

export function getEventsInfo(host: string) {
  return {
    donation: {
      type: 'donation',
      name: $t('Donation'),
      testerUrl() {
        return `https://${host}/api/v5/slobs/test/streamlabs/donation`;
      },
    },

    follow: {
      type: 'follow',
      name: $t('Follow'),
      url(platform: TPlatform) {
        return `https://${host}/api/v5/slobs/test/${platform}_account/follow`;
      },
      platforms: ['twitch', 'facebook'],
    },

    cheer: {
      type: 'cheer',
      name: $t('Cheer'),
      url() {
        return `https://${host}/api/v5/slobs/test/twitch_account/bits`;
      },
      platforms: ['twitch'],
    },

    subscription: {
      type: 'subscription',
      name: $t('Subscription'),
      url(platform: TPlatform) {
        return `https://${host}/api/v5/slobs/test/${platform}_account/subscription`;
      },
      names: [$t('Subscription'), $t('Membership')],
      platforms: ['twitch', 'youtube'],
    },

    host: {
      name: $t('Host'),
      type: 'host',
      url() {
        return `https://${host}/api/v5/slobs/test/twitch_account/host`;
      },
      platforms: ['twitch'],
    },
  };
}

export interface IAlertInfo {
  type: TAlertType;
  name: string;
  url(platform: TPlatform): string;
  platforms: TPlatform[];
}
