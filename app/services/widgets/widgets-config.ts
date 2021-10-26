import { AnchorPoint } from '../../util/ScalableRectangle';
import { $t } from '../i18n';
import { TAlertType } from './alerts-config';

export type TWidgetType = 'AlertBox' | 'ViewerCount';

export interface IWidgetConfig {
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

export function getWidgetsConfig(host: string, token: string): Record<TWidgetType, IWidgetConfig> {
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
        width: 850,
        height: 940,
      },

      url: `https://${host}/alert-box/v3/${token}`,
      previewUrl: `https://${host}}/alert-box/v3/${token}`,
      dataFetchUrl: `https://${host}/api/v5/slobs/widget/alertbox?include_linked_integrations_only=true&primary_only=false`,
      settingsSaveUrl: `https://${host}/api/v5/slobs/widget/alertbox`,
      settingsUpdateEvent: 'filteredAlertBoxSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: false,
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

      settingsWindowSize: {
        width: 600,
        height: 900,
      },

      previewUrl: `https://${host}/widgets/viewer-count?token=${token}&simulate=1`,
      dataFetchUrl: `https://${host}/api/v5/slobs/widget/viewercount`,
      settingsSaveUrl: `https://${host}/api/v5/slobs/widget/viewercount`,
      settingsUpdateEvent: 'viewerCountSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: true,
    },
    // TODO:
    // BitGoal: {
    //
    // },

    // DonationGoal: {
    //
    // },

    // CharityGoal: {
    //
    // },

    // FollowerGoal: {
    //
    // },

    // StarsGoal: {
    //
    // },

    // SubGoal: {
    //
    // },

    // SubscriberGoal: {
    //
    // },

    // ChatBox: {
    //
    // },

    // ChatHighlight: {
    //
    // },

    // Credits: {
    //
    // },

    // DonationTicker: {
    //
    //  },

    // EmoteWall: {
    //
    // },

    // EventList: {
    //
    // },

    // MediaShare: {
    //
    //  },

    // Poll: {
    //
    //  },

    // SpinWheel: {
    //
    // },

    // SponsorBanner: {
    //
    // },

    // StreamBoss: {
    //
    //  },

    // TipJar: {
    //
    // },
  };
}
