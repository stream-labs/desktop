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
  template: TStreamlabelFormType;
}

export interface IStreamlabelSettingsDefinition {
  format: { tokens: string[]; };
  item_format?: { tokens: string[]; };
  item_separator?: { tokens: string[]; };
  includeResubsOption?: boolean;
}

type TStreamlabelFormType = 'simpleFileForm' | 'itemFileForm';


export function getDefinitions(platform: TPlatform) {
  if (platform === 'twitch') {
    return {
      ...allDefinitions,
      ...twitchDefinitions
    };
  } else if (platform === 'youtube') {
    return {
      ...allDefinitions,
      ...youtubeDefinitions
    };
  } else {
    throw new Error(`${platform} is not a supported platform`);
  }
}


/*********************
 * Definitions Below *
 *********************/


/**
 * Used by all services
 */
const allDefinitions: IStreamlabelSet = {
  top_donator: {
    label: 'Top Donator',
    files: [{
      name: 'all_time_top_donator',
      label: 'All-Time Top Donator',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'session_top_donator',
      label: 'Session Top Donator',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'monthly_top_donator',
      label: 'Monthly Top Donator',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: '30day_top_donator',
      label: '30-Day Top Donator',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'weekly_top_donator',
      label: 'Weekly Top Donator',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }]
  },
  top_donators: {
    label: 'Top Donators (Top 10)',
    files: [{
      name: 'all_time_top_donators',
      label: 'All-Time Top Donators',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: 'session_top_donators',
      label: 'Session Top Donators',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: 'monthly_top_donators',
      label: 'Monthly Top Donators',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: '30day_top_donators',
      label: '30-Day Top Donators',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: 'weekly_top_donators',
      label: 'Weekly Top Donators',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }]
  },
  top_donations: {
    label: 'Top Donations',
    files: [{
      name: 'all_time_top_donations',
      label: 'All-Time Top Donations',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: 'session_top_donations',
      label: 'Session Top Donations',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: 'monthly_top_donations',
      label: 'Monthly Top Donations',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: '30day_top_donations',
      label: '30-Day Top Donations',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: 'weekly_top_donations',
      label: 'Weekly Top Donations',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }]
  },
  donation_amount: {
    label: 'Donation Amount',
    files: [{
      name: 'total_donation_amount',
      label: 'Total Donation Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'session_donation_amount',
      label: 'Session Donation Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'monthly_donation_amount',
      label: 'Monthly Donation Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: '30day_donation_amount',
      label: '30-Day Donation Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'weekly_donation_amount',
      label: 'Weekly Donation Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }]
  },
  donators: {
    label: 'Donators',
    files: [
      {
        name: 'most_recent_donator',
        label: 'Most Recent Donator',
        settings: {
          format: { tokens: ['{name}', '{amount}', '{message}'] }
        },
        template: 'simpleFileForm'
      }, {
        name: 'session_donators',
        label: 'Session Donators (Max 25)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}', '{message}'] },
          item_separator: { tokens: ['\\n'] }
        },
        template: 'itemFileForm'
      }, {
        name: 'session_most_recent_donator',
        label: 'Session Recent Donator',
        settings: {
          format: { tokens: ['{name}', '{amount}', '{message}'] }
        },
        template: 'simpleFileForm'
      }
    ]
  },
  donation_goal: {
    label: 'Donation Goal',
    files: [
      {
        name: 'donation_goal',
        label: 'Donation Goal',
        settings: {
          format: { tokens: ['{title}', '{currentAmount}', '{goalAmount}'] }
        },
        template: 'simpleFileForm'
      }
    ]
  }
};

/**
 * Used by Youtube only
 */
const youtubeDefinitions: IStreamlabelSet = {
  // Trains are currently disabled

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
          format: { tokens: ['{count}'] }
        },
        template: 'simpleFileForm'
      },
      {
        name: 'most_recent_youtube_subscriber',
        label: 'Most Recent Subscriber',
        settings: {
          format: { tokens: ['{name}'] },
          includeResubsOption: true
        },
        template: 'simpleFileForm'
      },
      {
        name: 'session_youtube_subscribers',
        label: 'Session Subscribers (Max 100)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}'] },
          item_separator: { tokens: ['\\n'] },
          includeResubsOption: true
        },
        template: 'itemFileForm'
      },
      {
        name: 'session_youtube_subscriber_count',
        label: 'Session Subscriber Count',
        settings: {
          format: { tokens: ['{count}'] },
          includeResubsOption: true
        },
        template: 'simpleFileForm'
      },
      {
        name: 'session_most_recent_youtube_subscriber',
        label: 'Session Most Recent Subscriber',
        settings: {
          format: { tokens: ['{name}'] },
          includeResubsOption: true
        },
        template: 'simpleFileForm'
      }
    ]
  },
  sponsors: {
    label: 'Sponsors',
    files: [
      {
        name: 'total_youtube_sponsor_count',
        label: 'Total Sponsor Count',
        settings: {
          format: { tokens: ['{count}'] }
        },
        template: 'simpleFileForm'
      },
      {
        name: 'most_recent_youtube_sponsor',
        label: 'Most Recent Sponsor',
        settings: {
          format: { tokens: ['{name}'] },
          includeResubsOption: true
        },
        template: 'simpleFileForm'
      },
      {
        name: 'session_youtube_sponsors',
        label: 'Session Sponsors (Max 100)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}'] },
          item_separator: { tokens: ['\\n'] },
          includeResubsOption: true
        },
        template: 'itemFileForm'
      },
      {
        name: 'session_youtube_sponsor_count',
        label: 'Session Sponsor Count',
        settings: {
          format: { tokens: ['{count}'] },
          includeResubsOption: true
        },
        template: 'simpleFileForm'
      },
      {
        name: 'session_most_recent_youtube_sponsor',
        label: 'Session Most Recent Sponsor',
        settings: {
          format: { tokens: ['{name}'] },
          includeResubsOption: true
        },
        template: 'simpleFileForm'
      }
    ]
  },
  superchat_amount: {
    label: 'Super Chat Amount',
    files: [{
      name: 'total_youtube_superchat_amount',
      label: 'Total Super Chat Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'session_youtube_superchat_amount',
      label: 'Session Super Chat Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'monthly_youtube_superchat_amount',
      label: 'Monthly Super Chat Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: '30day_youtube_superchat_amount',
      label: '30-Day Super Chat Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'weekly_youtube_superchat_amount',
      label: 'Weekly Super Chat Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }]
  },

  top_superchatters: {
    label: 'Top Super Chatters (Top 10)',
    files: [{
      name: 'all_time_top_youtube_superchatters',
      label: 'All-Time Top Super Chatters',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: 'session_top_youtube_superchatters',
      label: 'Session Top Super Chatters',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: 'monthly_top_youtube_superchatters',
      label: 'Monthly Top Super Chatters',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: '30day_top_youtube_superchatters',
      label: '30-Day Top Super Chatters',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: 'weekly_top_youtube_superchatters',
      label: 'Weekly Top Super Chatters',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }]
  },

  top_superchatter: {
    label: 'Top Super Chatter',
    files: [{
      name: 'all_time_top_youtube_superchatter',
      label: 'All-Time Top Super Chatter',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'session_top_youtube_superchatter',
      label: 'Session Top Super Chatter',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'monthly_top_youtube_superchatter',
      label: 'Monthly Top Super Chatter',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: '30day_top_youtube_superchatter',
      label: '30-Day Top Super Chatter',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'weekly_top_youtube_superchatter',
      label: 'Weekly Top Super Chatter',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }]
  },

  superchatters: {
    label: 'Super Chatters',
    files: [
      {
        name: 'most_recent_youtube_superchatter',
        label: 'Most Recent Super Chatter',
        settings: {
          format: { tokens: ['{name}', '{amount}', '{message}'] }
        },
        template: 'simpleFileForm'
      }, {
        name: 'session_superchatters',
        label: 'Session Super Chatters (Max 25)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}', '{message}'] },
          item_separator: { tokens: ['\\n'] }
        },
        template: 'itemFileForm'
      }, {
        name: 'session_most_recent_youtube_superchatter',
        label: 'Session Recent Super Chatter',
        settings: {
          format: { tokens: ['{name}', '{amount}', '{message}'] }
        },
        template: 'simpleFileForm'
      }
    ]
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
          item_separator: { tokens: ['\\n'] }
        },
        template: 'itemFileForm'

      },
      {
        name: 'monthly_top_youtube_superchats',
        label: 'Monthly Top Super Chats',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] }
        },
        template: 'itemFileForm'
      },
      {
        name: '30day_top_youtube_superchats',
        label: '30-Day Top Super Chats',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] }
        },
        template: 'itemFileForm'
      },
      {
        name: 'weekly_top_youtube_superchats',
        label: 'Weekly Top Super Chats',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] }
        },
        template: 'itemFileForm'
      },
      {
        name: 'session_top_youtube_superchats',
        label: 'Session Top Super Chats',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] }
        },
        template: 'itemFileForm'
      }
    ]
  },
};

/**
 * Used by Twitch
 */
const twitchDefinitions: IStreamlabelSet = {
  // Trains are currently disabled

  // trains_combos: {
  //   label: 'Trains/Combos',
  //   files: [
  //     {
  //       name: 'train_tips',
  //       label: 'Donation Train',
  //       template: 'trainFileForm'
  //     },
  //     {
  //       name: 'train_twitch_follows',
  //       label: 'Follows Train',
  //       template: 'trainFileForm'
  //     },
  //     {
  //       name: 'train_twitch_subscriptions',
  //       label: 'Subscription Train',
  //       template: 'trainFileForm'
  //     }
  //   ]
  // },
  top_cheerer: {
    label: 'Top Cheerer',
    files: [{
      name: 'all_time_top_cheerer',
      label: 'All-Time Top Cheerer',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'session_top_cheerer',
      label: 'Session Top Cheerer',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'monthly_top_cheerer',
      label: 'Monthly Top Cheerer',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: '30day_top_cheerer',
      label: '30-Day Top Cheerer',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'weekly_top_cheerer',
      label: 'Weekly Top Cheerer',
      settings: {
        format: { tokens: ['{name}', '{amount}'] }
      },
      template: 'simpleFileForm'
    }]
  },
  top_cheerers: {
    label: 'Top Cheerers (Top 10)',
    files: [{
      name: 'all_time_top_cheerers',
      label: 'All-Time Top Cheerers',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: 'session_top_cheerers',
      label: 'Session Top Cheerers',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: 'monthly_top_cheerers',
      label: 'Monthly Top Cheerers',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: '30day_top_cheerers',
      label: '30-Day Top Cheerers',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }, {
      name: 'weekly_top_cheerers',
      label: 'Weekly Top Cheerers',
      settings: {
        format: { tokens: ['{list}'] },
        item_format: { tokens: ['{name}', '{amount}'] },
        item_separator: { tokens: ['\\n'] }
      },
      template: 'itemFileForm'
    }]
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
          item_separator: { tokens: ['\\n'] }
        },
        template: 'itemFileForm'

      },
      {
        name: 'monthly_top_cheers',
        label: 'Monthly Top Cheers',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] }
        },
        template: 'itemFileForm'
      },
      {
        name: '30day_top_cheers',
        label: '30-Day Top Cheers',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] }
        },
        template: 'itemFileForm'
      },
      {
        name: 'weekly_top_cheers',
        label: 'Weekly Top Cheers',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] }
        },
        template: 'itemFileForm'
      },
      {
        name: 'session_top_cheers',
        label: 'Session Top Cheers',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}'] },
          item_separator: { tokens: ['\\n'] }
        },
        template: 'itemFileForm'
      }
    ]
  },
  cheer_amount: {
    label: 'Cheer Amount',
    files: [{
      name: 'total_cheer_amount',
      label: 'Total Cheer Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'session_cheer_amount',
      label: 'Session Cheer Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'monthly_cheer_amount',
      label: 'Monthly Cheer Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: '30day_cheer_amount',
      label: '30-Day Cheer Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }, {
      name: 'weekly_cheer_amount',
      label: 'Weekly Cheer Amount',
      settings: {
        format: { tokens: ['{amount}'] }
      },
      template: 'simpleFileForm'
    }]
  },
  cheerers: {
    label: 'Cheerers',
    files: [
      {
        name: 'most_recent_cheerer',
        label: 'Most Recent Cheerer',
        settings: {
          format: { tokens: ['{name}', '{amount}', '{message}'] }
        },
        template: 'simpleFileForm'
      }, {
        name: 'session_cheerers',
        label: 'Session Cheerers (Max 25)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}', '{amount}', '{message}'] },
          item_separator: { tokens: ['\\n'] }
        },
        template: 'itemFileForm'
      }, {
        name: 'session_most_recent_cheerer',
        label: 'Session Recent Cheerer',
        settings: {
          format: { tokens: ['{name}', '{amount}', '{message}'] }
        },
        template: 'simpleFileForm'
      }
    ]
  },
  followers: {
    label: 'Followers',
    files: [
      {
        name: 'total_follower_count',
        label: 'Total Follower Count',
        settings: {
          format: { tokens: ['{count}'] }
        },
        template: 'simpleFileForm'
      },
      {
        name: 'most_recent_follower',
        label: 'Most Recent Follower',
        settings: {
          format: { tokens: ['{name}'] }
        },
        template: 'simpleFileForm'
      },
      {
        name: 'session_followers',
        label: 'Session Followers (Max 100)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}'] },
          item_separator: { tokens: ['\\n'] }
        },
        template: 'itemFileForm'
      },
      {
        name: 'session_follower_count',
        label: 'Session Follower Count',
        settings: {
          format: { tokens: ['{count}'] }
        },
        template: 'simpleFileForm'
      },
      {
        name: 'session_most_recent_follower',
        label: 'Session Most Recent Follower',
        settings: {
          format: { tokens: ['{name}'] }
        },
        template: 'simpleFileForm'
      }
    ]
  },
  subscribers: {
    label: 'Subscribers',
    files: [
      {
        name: 'total_subscriber_count',
        label: 'Total Subscriber Count',
        settings: {
          format: { tokens: ['{count}'] }
        },
        template: 'simpleFileForm'
      },
      {
        name: 'total_subscriber_score',
        label: 'Total Subscriber Points',
        settings: {
          format: { tokens: ['{count}'] }
        },
        template: 'simpleFileForm'
      },
      {
        name: 'most_recent_subscriber',
        label: 'Most Recent Subscriber',
        settings: {
          format: { tokens: ['{name}', '{months}'] },
          includeResubsOption: true
        },
        template: 'simpleFileForm'
      },
      {
        name: 'session_subscribers',
        label: 'Session Subscribers (Max 100)',
        settings: {
          format: { tokens: ['{list}'] },
          item_format: { tokens: ['{name}'] },
          item_separator: { tokens: ['\\n'] },
          includeResubsOption: true
        },
        template: 'itemFileForm'
      },
      {
        name: 'session_subscriber_count',
        label: 'Session Subscriber Count',
        settings: {
          format: { tokens: ['{count}'] },
          includeResubsOption: true
        },
        template: 'simpleFileForm'
      },
      {
        name: 'session_most_recent_subscriber',
        label: 'Session Most Recent Subscriber',
        settings: {
          format: { tokens: ['{name}', '{months}'] },
          includeResubsOption: true
        },
        template: 'simpleFileForm'
      }
    ]
  }
};
