import { $t } from '../i18n';
import { TPlatform } from '../platforms';
export type TAlertType =
  | 'donation'
  | 'trSubscription'
  | 'trFollow'
  | 'trRaid'
  | 'twSubscription'
  | 'twFollow'
  | 'twCheer'
  | 'fbFollow'
  | 'fbSupport'
  | 'fbStars'
  | 'fbLike'
  | 'fbShare'
  | 'fbSupportGift'
  | 'twHost'
  | 'merch'
  | 'twRaid'
  | 'ytMembership'
  | 'ytSubscriber'
  | 'ytSuperchat';

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

export function getAlertsConfig(
  host: string,
  platforms: TPlatform[] = [],
): Record<TAlertType, IAlertConfig> {
  return {
    donation: {
      type: 'donation',
      name: $t('Donation'),
      url() {
        return `https://${host}/api/v5/slobs/test/streamlabs/donation`;
      },
      tooltip: $t('Plays an alert when a viewer sends a tip/donation'),
    },

    twFollow: {
      type: 'twFollow',
      name: $t('Follow'),
      apiKey: 'follow',
      url() {
        return `https://${host}/api/v5/slobs/test/twitch_account/follow`;
      },
      platforms: ['twitch'],
      tooltip: $t('Plays an alert for new Twitch followers'),
    },

    fbFollow: {
      type: 'fbFollow',
      apiKey: 'facebook_follow',
      name: $t('Facebook Follow'),
      url() {
        return `https://${host}/api/v5/slobs/test/facebook_account/follow`;
      },
      platforms: ['facebook'],
      tooltip: $t('Plays an alert for new Facebook followers'),
    },

    trFollow: {
      type: 'trFollow',
      name: $t('Trovo Follow'),
      apiKey: 'trovo_follow',
      url() {
        return `https://${host}/api/v5/slobs/test/trovo_account/follow`;
      },
      platforms: ['trovo'],
      tooltip: $t('Plays an alert for new Trovo followers'),
    },

    twSubscription: {
      type: 'twSubscription',
      apiKey: 'sub',
      name: $t('Subscription'),
      url() {
        return `https://${host}/api/v5/slobs/test/twitch_account/subscription`;
      },
      platforms: ['twitch'],
      tooltip: $t('Plays an alert for new Twitch subscriptions'),
      tooltipLink: 'https://help.twitch.tv/s/article/how-to-subscribe',
    },

    trSubscription: {
      type: 'trSubscription',
      apiKey: 'trovo_sub',
      name: $t('Trovo Subscription'),
      url() {
        return `https://${host}/api/v5/slobs/test/trovo_account/subscription`;
      },
      platforms: ['trovo'],
      tooltip: $t('Plays an alert for new Trovo subscriptions'),
    },

    twCheer: {
      type: 'twCheer',
      apiKey: 'bits',
      name: $t('Cheer (Bits)'),
      url() {
        return `https://${host}/api/v5/slobs/test/twitch_account/bits`;
      },
      platforms: ['twitch'],
      tooltip: $t('Plays an alert when a viewer sends a Cheer'),
      tooltipLink: 'https://help.twitch.tv/s/article/guide-to-cheering-with-bits',
    },

    twHost: {
      name: $t('Host'),
      type: 'twHost',
      apiKey: 'host',
      url() {
        return `https://${host}/api/v5/slobs/test/twitch_account/host`;
      },
      platforms: ['twitch'],
      tooltip: $t('Plays an alert when another streamer hosts your channel'),
      tooltipLink: 'https://help.twitch.tv/s/article/how-to-use-host-mode',
    },

    twRaid: {
      name: $t('Raid'),
      type: 'twRaid',
      apiKey: 'raid',
      url() {
        return `https://${host}/api/v5/slobs/test/twitch_account/raid`;
      },
      platforms: ['twitch'],
      tooltip: $t('Plays an alert when another streamer raids your channel'),
      tooltipLink: 'https://help.twitch.tv/s/article/how-to-use-raids',
    },

    trRaid: {
      name: $t('Trovo Raid'),
      type: 'trRaid',
      apiKey: 'trovo_raid',
      url() {
        return `https://${host}/api/v5/slobs/test/trovo_account/raid`;
      },
      platforms: ['trovo'],
      tooltip: $t('Plays an alert when another streamer raids your channel'),
    },

    ytMembership: {
      name: $t('YouTube Membership'),
      type: 'ytMembership',
      apiKey: 'sponsor',
      url() {
        return `https://${host}/api/v5/slobs/test/youtube_account/subscription`;
      },
      platforms: ['youtube'],
      tooltip: $t('Plays an alert for new YouTube Memberships'),
      tooltipLink: 'https://creatoracademy.youtube.com/page/course/channel-memberships',
    },

    ytSuperchat: {
      name: $t('YouTube Super Chat'),
      type: 'ytSuperchat',
      apiKey: 'fanfunding',
      url() {
        return `https://${host}/api/v5/slobs/test/youtube_account/superchat`;
      },
      platforms: ['youtube'],
      tooltip: $t('Plays an alert when a viewer sends a Super Chat'),
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
      tooltip: $t('Plays an alert for new Facebook Supporters'),
      tooltipLink: 'https://www.facebook.com/business/help/316098022481499',
    },

    fbSupportGift: {
      name: $t('Facebook Gifted Support'),
      type: 'fbSupportGift',
      apiKey: 'facebook_support_gifter',
      url() {
        return `https://${host}/api/v5/slobs/test/facebook_account/giftSupport`;
      },
    },

    fbStars: {
      name: $t('Facebook Stars'),
      apiKey: 'facebook_stars',
      type: 'fbStars',
      url() {
        return `https://${host}/api/v5/slobs/test/facebook_account/stars`;
      },
      platforms: ['facebook'],
      tooltip: $t('Plays an alert when a viewer sends Stars'),
      tooltipLink: 'https://www.facebook.com/business/help/903272529876480',
    },

    fbLike: {
      name: $t('Facebook Like'),
      apiKey: 'facebook_like',
      type: 'fbLike',
      url() {
        return `https://${host}/api/v5/slobs/test/facebook_account/like`;
      },
      platforms: ['facebook'],
      tooltip: $t('Plays an alert when a viewer likes your stream'),
    },

    fbShare: {
      name: $t('Facebook Share'),
      apiKey: 'facebook_share',
      type: 'fbShare',
      url() {
        return `https://${host}/api/v5/slobs/test/facebook_account/share`;
      },
      platforms: ['facebook'],
      tooltip: $t('Plays an alert when a viewer shares your stream'),
    },

    merch: {
      name: $t('Merch'),
      type: 'merch',
      url() {
        return `https://${host}/api/v5/slobs/test/streamlabs/merch`;
      },
      tooltip: $t('Plays an alert when a viewer buys your merch'),
      tooltipLink: 'https://streamlabs.com/dashboard#/merchadmin',
    },

    ytSubscriber: {
      name: $t('YouTube Subscribers'),
      type: 'ytSubscriber',
      apiKey: 'subscriber',
      url() {
        return `https://${host}/api/v5/slobs/test/youtube_account/follow`;
      },
      platforms: ['youtube'],
      tooltip: $t('Plays an alert when a viewer subscribes to your YouTube channel'),
    },
  };
}
