import { $t } from '../i18n';
import { TPlatform } from '../platforms';
export type TAlertType =
  | 'donation'
  | 'subscription'
  | 'follow'
  | 'twCheer'
  | 'fbSupport'
  | 'fbStars'
  | 'fbLike'
  | 'fbShare'
  | 'fbSupportGift'
  | 'twHost'
  | 'merch'
  | 'twRaid'
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
  // define the Subscription alert name based on connected platforms
  let subscriptionName = $t('Subscription');
  if (platforms.includes('youtube') && platforms.includes('twitch')) {
    subscriptionName = $t('Subs / Members');
  } else if (platforms.includes('youtube')) {
    subscriptionName = $t('Membership');
  }

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

    subscription: {
      type: 'subscription',
      apiKey: 'sub',
      name: subscriptionName,
      url(platform: TPlatform = 'twitch') {
        return `https://${host}/api/v5/slobs/test/${platform}_account/subscription`;
      },
      platforms: ['twitch', 'youtube'],
      tooltip: $t('Triggers for new Twitch subscriptions and Youtube memberships'),
    },

    twCheer: {
      type: 'twCheer',
      apiKey: 'bits',
      name: $t('Twitch Cheer (Bits)'),
      url() {
        return `https://${host}/api/v5/slobs/test/twitch_account/bits`;
      },
      platforms: ['twitch'],
      tooltip: $t('Bits are used to Cheer, which is a way viewers can show you support.'),
      tooltipLink: 'https://help.twitch.tv/s/article/guide-to-cheering-with-bits',
    },

    twHost: {
      name: $t('Twitch Host'),
      type: 'twHost',
      apiKey: 'host',
      url() {
        return `https://${host}/api/v5/slobs/test/twitch_account/host`;
      },
      platforms: ['twitch'],
    },

    twRaid: {
      name: $t('Twitch Raid'),
      type: 'twRaid',
      apiKey: 'raid',
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
      tooltip: $t('Triggers when somebody liked your stream'),
    },

    fbShare: {
      name: $t('Facebook Share'),
      apiKey: 'facebook_share',
      type: 'fbShare',
      url() {
        return `https://${host}/api/v5/slobs/test/facebook_account/share`;
      },
      platforms: ['facebook'],
      tooltip: $t('Triggers when somebody share your stream'),
    },

    merch: {
      name: $t('Merch'),
      type: 'merch',
      url() {
        return `https://${host}/api/v5/slobs/test/streamlabs/merch`;
      },
      tooltip: $t('Triggers when somebody bought your merch'),
      tooltipLink: 'https://streamlabs.com/dashboard#/merchadmin',
    },

    ytSubscriber: {
      name: $t('Youtube Subscribers'),
      type: 'ytSubscriber',
      apiKey: 'subscriber',
      url() {
        return `https://${host}/api/v5/slobs/test/youtube_account/subscriber`;
      },
    },
  };
}
