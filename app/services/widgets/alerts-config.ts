import { $t } from '../i18n';
import { TPlatform } from '../platforms';

/*
   TODO: this should be `staticConfig.alertTypes`, we're duplicating here,
     can we:
     - make the type dynamic (might be hard without runtime support, i.e (@effect-ts/schema extracted type)
     - split by platform/integration
     - use that specific type
     Also, there's an unwritten rule that the backend will always have unique
     keys for what's essentially `alert.type`, but we would like to see if this
     is enforced.
 */
export type TAlertType =
  // Streamlabs
  | 'donation'
  | 'merch'
  | 'loyalty_store_redemption'
  // Streamlabs Charity
  | 'streamlabscharitydonation'
  // Twitch
  | 'bits'
  | 'follow'
  | 'raid'
  | 'resub'
  | 'sub'
  | 'twitchcharitydonation'
  // YouTube
  | 'fanfunding' // Super Chat
  | 'membershipGift'
  | 'sponsor'
  | 'subscriber'
  // Trovo
  | 'trovo_follow'
  | 'trovo_raid'
  | 'trovo_sub'
  // Facebook
  | 'facebook_follow'
  | 'facebook_like'
  | 'facebook_share'
  | 'facebook_stars'
  | 'facebook_support'
  | 'facebook_support_gifter'
  // DonorDrive
  | 'donordrivedonation'
  // ExtraLife
  | 'eldonation'
  // JustGiving
  | 'justgivingdonation'
  // Patreon
  | 'pledge'
  // Tiltify
  | 'tiltifydonation'
  // TreatStream
  | 'treat';

export interface IAlertConfig {
  type: TAlertType;
  apiKey?: string;
  name: string;
  platforms?: TPlatform[];
  names?: string[];
  tooltip?: string;
  tooltipLink?: string;
}

export function getAlertsConfig(
  host: string,
  platforms: TPlatform[] = [],
): Record<TAlertType, IAlertConfig> {
  /*
    TODO:
      we might no longer need both `type` and `apiKey`,
      also do we wanna really wanna support everything?
   */
  return {
    donation: {
      type: 'donation' as const,
      name: $t('Donation'),
      tooltip: $t('Plays an alert when a viewer sends a tip/donation'),
    },

    merch: {
      name: $t('Merch'),
      type: 'merch',
      tooltip: $t('Plays an alert when a viewer buys your merch'),
      tooltipLink: 'https://streamlabs.com/dashboard#/merchadmin',
    },

    follow: {
      type: 'follow',
      name: $t('Twitch Follow'),
      apiKey: 'follow',
      platforms: ['twitch'],
      tooltip: $t('Plays an alert for new Twitch followers'),
    },

    facebook_follow: {
      type: 'facebook_follow',
      apiKey: 'facebook_follow',
      name: $t('Facebook Follow'),
      platforms: ['facebook'],
      tooltip: $t('Plays an alert for new Facebook followers'),
    },

    trovo_follow: {
      type: 'trovo_follow',
      name: $t('Trovo Follow'),
      apiKey: 'trovo_follow',
      platforms: ['trovo'],
      tooltip: $t('Plays an alert for new Trovo followers'),
    },

    sub: {
      type: 'sub',
      apiKey: 'sub',
      name: $t('Twitch Subscription'),
      platforms: ['twitch'],
      tooltip: $t('Plays an alert for new Twitch subscriptions'),
      tooltipLink: 'https://help.twitch.tv/s/article/how-to-subscribe',
    },

    // FIXME: this is a copy of `sub`
    resub: {
      type: 'resub',
      apiKey: 'resub',
      name: $t('Twitch Re-sub'),
      platforms: ['twitch'],
      tooltip: $t('Plays an alert for renewed Twitch subscriptions'),
      tooltipLink: 'https://help.twitch.tv/s/article/how-to-subscribe',
    },

    trovo_sub: {
      type: 'trovo_sub',
      apiKey: 'trovo_sub',
      name: $t('Trovo Subscription'),
      platforms: ['trovo'],
      tooltip: $t('Plays an alert for new Trovo subscriptions'),
    },

    bits: {
      type: 'bits',
      apiKey: 'bits',
      name: $t('Twitch Cheer (Bits)'),
      platforms: ['twitch'],
      tooltip: $t('Plays an alert when a viewer sends a Cheer'),
      tooltipLink: 'https://help.twitch.tv/s/article/guide-to-cheering-with-bits',
    },

    raid: {
      name: $t('Twitch Raid'),
      type: 'raid',
      apiKey: 'raid',
      platforms: ['twitch'],
      tooltip: $t('Plays an alert when another streamer raids your channel'),
      tooltipLink: 'https://help.twitch.tv/s/article/how-to-use-raids',
    },

    trovo_raid: {
      name: $t('Trovo Raid'),
      type: 'trovo_raid',
      apiKey: 'trovo_raid',
      platforms: ['trovo'],
      tooltip: $t('Plays an alert when another streamer raids your channel'),
    },

    subscriber: {
      name: $t('YouTube Subscribers'),
      type: 'subscriber',
      apiKey: 'subscriber',
      platforms: ['youtube'],
      tooltip: $t('Plays an alert when a viewer subscribes to your YouTube channel'),
    },
    sponsor: {
      name: $t('YouTube Membership'),
      type: 'sponsor',
      apiKey: 'sponsor',
      platforms: ['youtube'],
      tooltip: $t('Plays an alert for new YouTube Memberships'),
      tooltipLink: 'https://creatoracademy.youtube.com/page/course/channel-memberships',
    },

    fanfunding: {
      name: $t('YouTube Super Chat'),
      type: 'fanfunding',
      apiKey: 'fanfunding',
      platforms: ['youtube'],
      tooltip: $t('Plays an alert when a viewer sends a Super Chat'),
      tooltipLink:
        'https://creatoracademy.youtube.com/page/lesson/superchat-and-superstickers_what-is-superchat_video',
    },

    facebook_support: {
      name: $t('Facebook Support'),
      type: 'facebook_support',
      apiKey: 'facebook_support',
      platforms: ['facebook'],
      tooltip: $t('Plays an alert for new Facebook Supporters'),
      tooltipLink: 'https://www.facebook.com/business/help/316098022481499',
    },

    facebook_support_gifter: {
      name: $t('Facebook Gifted Support'),
      type: 'facebook_support_gifter',
      apiKey: 'facebook_support_gifter',
    },

    facebook_stars: {
      name: $t('Facebook Stars'),
      apiKey: 'facebook_stars',
      type: 'facebook_stars',
      platforms: ['facebook'],
      tooltip: $t('Plays an alert when a viewer sends Stars'),
      tooltipLink: 'https://www.facebook.com/business/help/903272529876480',
    },

    facebook_like: {
      name: $t('Facebook Like'),
      apiKey: 'facebook_like',
      type: 'facebook_like',
      platforms: ['facebook'],
      tooltip: $t('Plays an alert when a viewer likes your stream'),
    },

    facebook_share: {
      name: $t('Facebook Share'),
      apiKey: 'facebook_share',
      type: 'facebook_share',
      platforms: ['facebook'],
      tooltip: $t('Plays an alert when a viewer shares your stream'),
    },

    loyalty_store_redemption: {
      name: $t('Loyalty Store Redemption'),
      apiKey: 'loyalty_store_redemption',
      type: 'loyalty_store_redemption',
      // TODO: should this be platforms or integrations
      // platforms: ['streamlabs']
      tooltip: $t("Plays an alert where there's a redemption from your Loyalty Store"),
    },

    streamlabscharitydonation: {
      name: $t('Streamlabs Charity Donation'),
      apiKey: 'streamlabscharitydonation',
      type: 'streamlabscharitydonation',
      // TODO: tooltip
    },

    twitchcharitydonation: {
      name: $t('Twitch Charity Donation'),
      apiKey: 'twitchcharitydonation',
      type: 'twitchcharitydonation',
      // TODO: tooltip
    },

    membershipGift: {
      name: $t('YouTube Membership Gift'),
      apiKey: 'membershipGift',
      type: 'membershipGift',
      // TODO: tooltip
    },

    donordrivedonation: {
      name: $t('DonorDrive Donation'),
      apiKey: 'membershipGift',
      type: 'membershipGift',
      // TODO: tooltip
    },

    eldonation: {
      name: $t('ExtraLife Donation'),
      apiKey: 'eldonation',
      type: 'eldonation',
      // TODO: tooltip
    },
    justgivingdonation: {
      name: $t('JustGiving Donation'),
      type: 'justgivingdonation',
      apiKey: 'justgivingdonation',
      // TODO: tooltip
    },
    pledge: {
      name: $t('Patreon Pledge'),
      apiKey: 'pledge',
      type: 'pledge',
      // TODO: tooltip
    },
    tiltifydonation: {
      name: $t('Tiltify Donation'),
      apiKey: 'tiltifydonation',
      type: 'tiltifydonation',
      // TODO: tooltip
    },
    treat: {
      name: $t('TreatStream Treat'),
      apiKey: 'treat',
      type: 'treat',
      // TODO: tooltip
    },
  };
}
