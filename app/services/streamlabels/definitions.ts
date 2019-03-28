import { TPlatform } from 'services/platforms';

export interface IStreamlabelSet {
  [categoryName: string]: IStreamlabelCategory;
}

export interface IStreamlabelCategory {
  label: string;
  files: IStreamlabelDefinition[];
}

export interface IStreamlabelDefinition {
  name: string;
  label: string;
  settings: IStreamlabelSettingsDefinition;
}

export interface IStreamlabelSettingsDefinition {
  format?: { tokens: string[] };
  item_format?: { tokens: string[] };
  item_separator?: { tokens: string[] };
  settingsStat?: string;
  settingsWhitelist?: string[];
}

type TStreamlabelFormType = 'simpleFileForm' | 'itemFileForm';

export function getDefinitions(platform: TPlatform) {
  if (platform === 'twitch') {
    return {
      ...allDefinitions,
      ...twitchDefinitions,
    };
  }

  if (platform === 'youtube') {
    return {
      ...allDefinitions,
      ...youtubeDefinitions,
    };
  }

  if (platform === 'mixer') {
    return {
      ...allDefinitions,
      ...mixerDefinitions,
    };
  }

  if (platform === 'facebook') {
    return {
      ...allDefinitions,
      ...facebookDefinitions,
    };
  }

  throw new Error(`${platform} is not a supported platform`);
}

/*********************
 * Definitions Below *
 *********************/

/**
 * Used by all services
 */
const allDefinitions: IStreamlabelSet = {
  top_donator: {
    label: 'Top Donor',
    files: [
      {
        name: 'all_time_top_donator',
        label: 'All-Time Top Donor',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: 'session_top_donator',
        label: 'Session Top Donor',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: 'monthly_top_donator',
        label: 'Monthly Top Donor',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: '30day_top_donator',
        label: '30-Day Top Donor',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: 'weekly_top_donator',
        label: 'Weekly Top Donor',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
    ],
  },
  top_donators: {
    label: 'Top Donors (Top 10)',
    files: [
      {
        name: 'all_time_top_donators',
        label: 'All-Time Top Donors',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_top_donators',
        label: 'Session Top Donors',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'monthly_top_donators',
        label: 'Monthly Top Donors',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: '30day_top_donators',
        label: '30-Day Top Donors',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'weekly_top_donators',
        label: 'Weekly Top Donors',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
    ],
  },
  top_donations: {
    label: 'Top Donations',
    files: [
      {
        name: 'all_time_top_donations',
        label: 'All-Time Top Donations',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_top_donations',
        label: 'Session Top Donations',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'monthly_top_donations',
        label: 'Monthly Top Donations',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: '30day_top_donations',
        label: '30-Day Top Donations',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'weekly_top_donations',
        label: 'Weekly Top Donations',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
    ],
  },
  donation_amount: {
    label: 'Donation Amount',
    files: [
      {
        name: 'total_donation_amount',
        label: 'Total Donation Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: 'session_donation_amount',
        label: 'Session Donation Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: 'monthly_donation_amount',
        label: 'Monthly Donation Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: '30day_donation_amount',
        label: '30-Day Donation Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: 'weekly_donation_amount',
        label: 'Weekly Donation Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
    ],
  },
  donators: {
    label: 'Donors',
    files: [
      {
        name: 'most_recent_donator',
        label: 'Most Recent Donor',
        settings: {
          format: { tokens: ['{name}', '{amount}', '{message}'] },
        },
      },
      {
        name: 'session_donators',
        label: 'Session Donors (Max 25)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}', '{message}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_most_recent_donator',
        label: 'Session Recent Donor',
        settings: {
          format: { tokens: ['{name}', '{amount}', '{message}'] },
        },
      },
    ],
  },
  donation_goal: {
    label: 'Donation Goal',
    files: [
      {
        name: 'donation_goal',
        label: 'Donation Goal',
        settings: {
          format: { tokens: ['{title}', '{currentAmount}', '{goalAmount}'] },
        },
      },
    ],
  },
};

/**
 * Used by Youtube only
 */
const youtubeDefinitions: IStreamlabelSet = {
  // Trains are currently disabled for youtube

  // trains_combos: {
  //   label: 'Trains/Combos',
  //   files: [
  //     {
  //       name: 'train_tips',
  //       label: 'Donation Train',
  //       template: 'trainFileForm'
  //     }
  //   ]
  // },
  subscribers: {
    label: 'Subscribers',
    files: [
      {
        name: 'total_youtube_subscriber_count',
        label: 'Total Subscriber Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'most_recent_youtube_subscriber',
        label: 'Most Recent Subscriber',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
      {
        name: 'session_youtube_subscribers',
        label: 'Session Subscribers (Max 100)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_youtube_subscriber_count',
        label: 'Session Subscriber Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'session_most_recent_youtube_subscriber',
        label: 'Session Most Recent Subscriber',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
    ],
  },
  sponsors: {
    label: 'Sponsors',
    files: [
      {
        name: 'total_youtube_sponsor_count',
        label: 'Total Sponsor Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'most_recent_youtube_sponsor',
        label: 'Most Recent Sponsor',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
      {
        name: 'session_youtube_sponsors',
        label: 'Session Sponsors (Max 100)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_youtube_sponsor_count',
        label: 'Session Sponsor Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'session_most_recent_youtube_sponsor',
        label: 'Session Most Recent Sponsor',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
    ],
  },
  superchat_amount: {
    label: 'Super Chat Amount',
    files: [
      {
        name: 'total_youtube_superchat_amount',
        label: 'Total Super Chat Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: 'session_youtube_superchat_amount',
        label: 'Session Super Chat Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: 'monthly_youtube_superchat_amount',
        label: 'Monthly Super Chat Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: '30day_youtube_superchat_amount',
        label: '30-Day Super Chat Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: 'weekly_youtube_superchat_amount',
        label: 'Weekly Super Chat Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
    ],
  },

  top_superchatters: {
    label: 'Top Super Chatters (Top 10)',
    files: [
      {
        name: 'all_time_top_youtube_superchatters',
        label: 'All-Time Top Super Chatters',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_top_youtube_superchatters',
        label: 'Session Top Super Chatters',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'monthly_top_youtube_superchatters',
        label: 'Monthly Top Super Chatters',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: '30day_top_youtube_superchatters',
        label: '30-Day Top Super Chatters',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'weekly_top_youtube_superchatters',
        label: 'Weekly Top Super Chatters',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
    ],
  },

  top_superchatter: {
    label: 'Top Super Chatter',
    files: [
      {
        name: 'all_time_top_youtube_superchatter',
        label: 'All-Time Top Super Chatter',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: 'session_top_youtube_superchatter',
        label: 'Session Top Super Chatter',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: 'monthly_top_youtube_superchatter',
        label: 'Monthly Top Super Chatter',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: '30day_top_youtube_superchatter',
        label: '30-Day Top Super Chatter',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: 'weekly_top_youtube_superchatter',
        label: 'Weekly Top Super Chatter',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
    ],
  },

  superchatters: {
    label: 'Super Chatters',
    files: [
      {
        name: 'most_recent_youtube_superchatter',
        label: 'Most Recent Super Chatter',
        settings: {
          format: { tokens: ['{name}', '{amount}', '{message}'] },
        },
      },
      {
        name: 'session_superchatters',
        label: 'Session Super Chatters (Max 25)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}', '{message}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_most_recent_youtube_superchatter',
        label: 'Session Recent Super Chatter',
        settings: {
          format: { tokens: ['{name}', '{amount}', '{message}'] },
        },
      },
    ],
  },

  top_superchats: {
    label: 'Top Super Chats',
    files: [
      {
        name: 'all_time_top_youtube_superchats',
        label: 'All Time Top Super Chats',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'monthly_top_youtube_superchats',
        label: 'Monthly Top Super Chats',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: '30day_top_youtube_superchats',
        label: '30-Day Top Super Chats',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'weekly_top_youtube_superchats',
        label: 'Weekly Top Super Chats',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_top_youtube_superchats',
        label: 'Session Top Super Chats',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
    ],
  },
};

/**
 * Used by Twitch
 */
const twitchDefinitions: IStreamlabelSet = {
  donation_train: {
    label: 'Donation Train',
    files: [
      {
        name: 'donation_train_clock',
        label: 'Donation Train Clock',
        settings: {
          settingsStat: 'train_tips',
          settingsWhitelist: ['duration', 'show_clock'],
        },
      },
      {
        name: 'donation_train_counter',
        label: 'Donation Train Counter',
        settings: {
          settingsStat: 'train_tips',
          settingsWhitelist: ['show_count'],
        },
      },
      {
        name: 'donation_train_latest_amount',
        label: 'Donation Train Latest Amount',
        settings: {
          settingsStat: 'train_tips',
          settingsWhitelist: [],
        },
      },
      {
        name: 'donation_train_latest_name',
        label: 'Donation Train Latest Donor',
        settings: {
          settingsStat: 'train_tips',
          settingsWhitelist: ['show_latest'],
        },
      },
      {
        name: 'donation_train_total_amount',
        label: 'Donation Train Total Amount',
        settings: {
          settingsStat: 'train_tips',
          settingsWhitelist: [],
        },
      },
    ],
  },
  follow_train: {
    label: 'Follow Train',
    files: [
      {
        name: 'follow_train_clock',
        label: 'Follow Train Clock',
        settings: {
          settingsStat: 'train_twitch_follows',
          settingsWhitelist: ['duration', 'show_clock'],
        },
      },
      {
        name: 'follow_train_counter',
        label: 'Follow Train Counter',
        settings: {
          settingsStat: 'train_twitch_follows',
          settingsWhitelist: ['show_count'],
        },
      },
      {
        name: 'follow_train_latest_name',
        label: 'Follow Train Latest Follower',
        settings: {
          settingsStat: 'train_twitch_follows',
          settingsWhitelist: ['show_latest'],
        },
      },
    ],
  },
  subscription_train: {
    label: 'Subscription Train',
    files: [
      {
        name: 'subscription_train_clock',
        label: 'Subscription Train Clock',
        settings: {
          settingsStat: 'train_twitch_subscriptions',
          settingsWhitelist: ['duration', 'show_clock'],
        },
      },
      {
        name: 'subscription_train_counter',
        label: 'Subscription Train Counter',
        settings: {
          settingsStat: 'train_twitch_subscriptions',
          settingsWhitelist: ['show_count'],
        },
      },
      {
        name: 'subscription_train_latest_name',
        label: 'Subscription Train Latest Subscriber',
        settings: {
          settingsStat: 'train_twitch_subscriptions',
          settingsWhitelist: ['show_latest'],
        },
      },
    ],
  },
  top_cheerer: {
    label: 'Top Cheerer',
    files: [
      {
        name: 'all_time_top_cheerer',
        label: 'All-Time Top Cheerer',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: 'session_top_cheerer',
        label: 'Session Top Cheerer',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: 'monthly_top_cheerer',
        label: 'Monthly Top Cheerer',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: '30day_top_cheerer',
        label: '30-Day Top Cheerer',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: 'weekly_top_cheerer',
        label: 'Weekly Top Cheerer',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
    ],
  },
  top_cheerers: {
    label: 'Top Cheerers (Top 10)',
    files: [
      {
        name: 'all_time_top_cheerers',
        label: 'All-Time Top Cheerers',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_top_cheerers',
        label: 'Session Top Cheerers',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'monthly_top_cheerers',
        label: 'Monthly Top Cheerers',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: '30day_top_cheerers',
        label: '30-Day Top Cheerers',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'weekly_top_cheerers',
        label: 'Weekly Top Cheerers',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
    ],
  },
  top_cheers: {
    label: 'Top Cheers',
    files: [
      {
        name: 'all_time_top_cheers',
        label: 'All Time Top Cheers',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'monthly_top_cheers',
        label: 'Monthly Top Cheers',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: '30day_top_cheers',
        label: '30-Day Top Cheers',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'weekly_top_cheers',
        label: 'Weekly Top Cheers',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_top_cheers',
        label: 'Session Top Cheers',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
    ],
  },
  cheer_amount: {
    label: 'Cheer Amount',
    files: [
      {
        name: 'total_cheer_amount',
        label: 'Total Cheer Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: 'session_cheer_amount',
        label: 'Session Cheer Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: 'monthly_cheer_amount',
        label: 'Monthly Cheer Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: '30day_cheer_amount',
        label: '30-Day Cheer Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: 'weekly_cheer_amount',
        label: 'Weekly Cheer Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
    ],
  },
  cheerers: {
    label: 'Cheerers',
    files: [
      {
        name: 'most_recent_cheerer',
        label: 'Most Recent Cheerer',
        settings: {
          format: { tokens: ['{name}', '{amount}', '{message}'] },
        },
      },
      {
        name: 'session_cheerers',
        label: 'Session Cheerers (Max 25)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}', '{message}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_most_recent_cheerer',
        label: 'Session Recent Cheerer',
        settings: {
          format: { tokens: ['{name}', '{amount}', '{message}'] },
        },
      },
    ],
  },
  followers: {
    label: 'Followers',
    files: [
      {
        name: 'total_follower_count',
        label: 'Total Follower Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'most_recent_follower',
        label: 'Most Recent Follower',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
      {
        name: 'session_followers',
        label: 'Session Followers (Max 100)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_follower_count',
        label: 'Session Follower Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'session_most_recent_follower',
        label: 'Session Most Recent Follower',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
    ],
  },
  subscribers: {
    label: 'Subscribers',
    files: [
      {
        name: 'total_subscriber_count',
        label: 'Total Subscriber Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'total_subscriber_score',
        label: 'Total Subscriber Points',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'most_recent_subscriber',
        label: 'Most Recent Subscriber',
        settings: {
          format: { tokens: ['{name}', '{months}'] },
        },
      },
      {
        name: 'session_subscribers',
        label: 'Session Subscribers (Max 100)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_subscriber_count',
        label: 'Session Subscriber Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'session_most_recent_subscriber',
        label: 'Session Most Recent Subscriber',
        settings: {
          format: { tokens: ['{name}', '{months}'] },
        },
      },
    ],
  },
};
const mixerDefinitions: IStreamlabelSet = {
  // trains_combos: {
  //   label: 'Trains/Combos',
  //   files: [
  //     {
  //       name: 'train_tips',
  //       label: 'Donation Train',
  //     },
  //     {
  //       name: 'train_mixer_follows',
  //       label: 'Follows Train',
  //     },
  //     {
  //       name: 'train_mixer_subscriptions',
  //       label: 'Subscription Train',
  //     }
  //   ]
  // },
  subscribers: {
    label: 'Subscribers',
    files: [
      // {
      //     name: 'total_mixer_subscriber_count',
      //     label: 'Total Subscriber Count',
      //     settings: {
      //         format: { tokens: ['{count}'] }
      //     },
      // },
      {
        name: 'most_recent_mixer_subscriber',
        label: 'Most Recent Subscriber',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
      {
        name: 'session_mixer_subscribers',
        label: 'Session Subscribers (Max 100)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_mixer_subscriber_count',
        label: 'Session Subscriber Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'session_most_recent_mixer_subscriber',
        label: 'Session Most Recent Subscriber',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
    ],
  },
  followers: {
    label: 'Followers',
    files: [
      // {
      //     name: 'total_follower_count',
      //     label: 'Total Follower Count',
      //     settings: {
      //         format: { tokens: ['{count}'] }
      //     },
      //     template: 'simpleFileForm'
      // },
      {
        name: 'most_recent_mixer_follower',
        label: 'Most Recent Follower',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
      {
        name: 'session_mixer_followers',
        label: 'Session Followers (Max 100)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_mixer_follower_count',
        label: 'Session Follower Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'session_most_recent_mixer_follower',
        label: 'Session Most Recent Follower',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
    ],
  },
};
const facebookDefinitions: IStreamlabelSet = {
  supporters: {
    label: 'Supporters',
    files: [
      {
        name: 'most_recent_facebook_supporter',
        label: 'Most Recent Supporter',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
      {
        name: 'session_facebook_supporters',
        label: 'Session Supporters (Max 100)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'total_facebook_supporter_count',
        label: 'Total Supporter Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'session_facebook_supporter_count',
        label: 'Session Supporter Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'session_most_recent_facebook_supporter',
        label: 'Session Most Recent Supporter',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
    ],
  },
  followers: {
    label: 'Followers',
    files: [
      {
        name: 'most_recent_facebook_follower',
        label: 'Most Recent follower',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
      {
        name: 'session_facebook_followers',
        label: 'Session Followers (Max 100)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_facebook_follower_count',
        label: 'Session Follower Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'total_facebook_follower_count',
        label: 'Total Follower Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'session_most_recent_facebook_follower',
        label: 'Session Most Recent Follower',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
    ],
  },
  likes: {
    label: 'Likes',
    files: [
      {
        name: 'most_recent_facebook_like',
        label: 'Most Recent Like',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
      {
        name: 'session_facebook_likes',
        label: 'Session Likes (Max 100)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_facebook_like_count',
        label: 'Session Like Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'total_facebook_like_count',
        label: 'Total Like Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'session_most_recent_facebook_like',
        label: 'Session Most Recent Like',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
    ],
  },
  shares: {
    label: 'Shares',
    files: [
      {
        name: 'most_recent_facebook_share',
        label: 'Most Recent Share',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
      {
        name: 'session_facebook_shares',
        label: 'Session Shares (Max 100)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_facebook_share_count',
        label: 'Session Share Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'total_facebook_share_count',
        label: 'Total Share Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: 'session_most_recent_facebook_share',
        label: 'Session Most Recent Share',
        settings: {
          format: { tokens: ['{name}'] },
        },
      },
    ],
  },
  stars: {
    label: 'Stars',
    files: [
      {
        name: 'total_facebook_stars_count',
        label: 'Total Stars Count',
        settings: {
          format: { tokens: ['{count}'] },
        },
      },
      {
        name: '90day_top_facebook_stars',
        label: '90-Day Top Stars',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'monthly_top_facebook_stars',
        label: 'Monthly Top Stars',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'weekly_top_facebook_stars',
        label: 'Weekly Top Stars',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: '30day_top_facebook_stars',
        label: '30-Day Top Stars',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_top_facebook_stars',
        label: 'Session Top Stars',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: '90day_top_facebook_star_senders',
        label: '90-Day Top Star Senders',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'monthly_top_facebook_star_senders',
        label: 'Monthly Top Star Senders',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'weekly_top_facebook_star_senders',
        label: 'Weekly Top Star Senders',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: '30day_top_facebook_star_senders',
        label: '30-Day Top Star Senders',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_top_facebook_star_senders',
        label: 'Session Top Star Senders',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: '90day_top_facebook_star_sender',
        label: '90-Day Top Star Sender',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: '30day_top_facebook_star_sender',
        label: '30-Day Top Star Sender',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: 'monthly_top_facebook_star_sender',
        label: 'Monthly Top Star Sender',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: 'weekly_top_facebook_star_sender',
        label: 'Weekly Top Star Sender',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
      {
        name: 'session_top_facebook_star_sender',
        label: 'Session Top Star Sender',
        settings: {
          format: { tokens: ['{name}', '{amount}'] },
        },
      },
    ],
  },
  star_amount: {
    label: 'Star Amount',
    files: [
      {
        name: 'session_facebook_star_amount',
        label: 'Session Cheer Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: 'monthly_facebook_star_amount',
        label: 'Monthly Cheer Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: '30day_facebook_star_amount',
        label: '30-Day Cheer Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
      {
        name: 'weekly_facebook_star_amount',
        label: 'Weekly Cheer Amount',
        settings: {
          format: { tokens: ['{amount}'] },
        },
      },
    ],
  },
  star_senders: {
    label: 'Star Senders',
    files: [
      {
        name: 'most_recent_facebook_star_sender',
        label: 'Most Recent Star Sender',
        settings: {
          format: { tokens: ['{name}', '{amount}', '{message}'] },
        },
      },
      {
        name: 'session_facebook_star_senders',
        label: 'Session Star Senders (Max 25)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}', '{message}'] },
          item_separator: { tokens: ['\\n'] },
        },
      },
      {
        name: 'session_most_recent_facebook_star_sender',
        label: 'Session Recent Star Sender',
        settings: {
          format: { tokens: ['{name}', '{amount}', '{message}'] },
        },
      },
    ],
  },
};
