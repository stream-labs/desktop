import { AnchorPoint } from '../../util/ScalableRectangle';
import { $t } from '../i18n';
import { TPlatform } from '../platforms';

export type TWidgetType = 'AlertBox' | 'ViewerCount';
export type TAlertType =
  | 'donation'
  | 'follow'
  | 'subscription'
  | 'cheer'
  | 'host'
  | 'ytSuperchat'
  | 'fbSupport'
  | 'fbStars'
  | 'fbLike'
  | 'raid';

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
        height: 870,
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

export function getEventsConfig(
  host: string,
  platforms: TPlatform[],
): Record<TAlertType, IAlertConfig> {
  return {
    donation: {
      type: 'donation',
      name: $t('Donation'),
      url() {
        return `https://${host}/api/v5/slobs/test/streamlabs/donation`;
      },
    },

    follow: {
      type: 'follow',
      name: $t('Follow'),
      url(platform: TPlatform = 'twitch') {
        return `https://${host}/api/v5/slobs/test/${platform}_account/follow`;
      },
      platforms: ['twitch', 'facebook'],
      tooltip: $t('Triggers for new Twitch and Facebook followers'),
    },

    cheer: {
      type: 'cheer',
      apiKey: 'bits',
      name: $t('Cheer (Bits)'),
      url() {
        return `https://${host}/api/v5/slobs/test/twitch_account/bits`;
      },
      platforms: ['twitch'],
      tooltip: $t('Bits are used to Cheer, which is a way viewers can show you support.'),
      tooltipLink: 'https://help.twitch.tv/s/article/guide-to-cheering-with-bits',
    },

    subscription: {
      type: 'subscription',
      apiKey: 'sub',
      name:
        platforms.includes('youtube') && !platforms.includes('twitch')
          ? $t('Membership')
          : $t('Subscription'),
      url(platform: TPlatform = 'twitch') {
        return `https://${host}/api/v5/slobs/test/${platform}_account/subscription`;
      },
      platforms: ['twitch', 'youtube'],
      tooltip: $t('Triggers for new Twitch subscriptions and Youtube memberships'),
    },

    host: {
      name: $t('Host'),
      type: 'host',
      url() {
        return `https://${host}/api/v5/slobs/test/twitch_account/host`;
      },
      platforms: ['twitch'],
    },

    raid: {
      name: $t('Raid'),
      type: 'raid',
      url() {
        return `https://${host}/api/v5/slobs/test/twitch_account/raid`;
      },
      platforms: ['twitch'],
      tooltip: $t('Using Raids, you can send viewers over to another channel after a stream'),
      tooltipLink: 'https://help.twitch.tv/s/article/how-to-use-raids',
    },

    ytSuperchat: {
      name: $t('YouTube Super Chat'),
      type: 'ytSuperchat',
      apiKey: 'fanfunding',
      url() {
        return `https://${host}/api/v5/slobs/test/youtube_account/superchat`;
      },
      platforms: ['youtube'],
      tooltip: $t(
        'Super Chat is a way to monetize your channel through the YouTube Partner Program',
      ),
      tooltipLink:
        'https://creatoracademy.youtube.com/page/lesson/superchat-and-superstickers_what-is-superchat_video',
    },

    fbSupport: {
      name: $t('Facebook Support'),
      type: 'fbSupport',
      apiKey: 'facebook_support',
      url() {
        return `https://${host}/api/v5/slobs/test/facebook_account/support`;
      },
      platforms: ['facebook'],
    },

    fbStars: {
      name: $t('Facebook Stars'),
      apiKey: 'facebook_stars',
      type: 'fbStars',
      url() {
        return `https://${host}/api/v5/slobs/test/facebook_account/stars`;
      },
      platforms: ['facebook'],
      tooltip: $t('Facebook Stars is a feature that allows you to monetize your stream'),
      tooltipLink: 'https://www.facebook.com/business/help/903272529876480?id=648321075955172',
    },

    fbLike: {
      name: $t('Facebook Like'),
      apiKey: 'facebook_like',
      type: 'fbLike',
      url() {
        return `https://${host}/api/v5/slobs/test/facebook_account/like`;
      },
      platforms: ['facebook'],
      tooltip: $t('Triggers when user liked your stream'),
    },
  };
}

export interface IAlertConfig {
  type: TAlertType;
  apiKey?: string;
  name: string;
  url(platform?: TPlatform): string;
  platforms?: TPlatform[];
  names?: string[];
  tooltip?: string;
  tooltipLink?: string;
}
