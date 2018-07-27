import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import ChatbotAlertsBase from 'components/page-components/Chatbot/module-bases/ChatbotAlertsBase.vue';
import TextInput from 'components/shared/inputs/TextInput.vue';
import TextAreaInput from 'components/shared/inputs/TextAreaInput.vue';
import ListInput from 'components/shared/inputs/ListInput.vue';
import NumberInput from 'components/shared/inputs/NumberInput.vue';
import {
  IListMetadata,
  ITextMetadata,
  INumberMetadata,
} from 'components/shared/inputs/index';

import {
  SubAlertMessage,
  TipMessage,
  HostMessage,
  RaidMessage,
} from 'services/chatbot/chatbot-interfaces';

interface SubMessage extends SubAlertMessage {
  tier: string;
}

interface INewAlertMetadata {
  followers: {
    newMessage: ITextMetadata;
  },
  subscriptions: {
    newMessage: {
      tier: IListMetadata<string>;
      months: INumberMetadata;
      message: ITextMetadata;
      is_gifted: boolean;
    }
  },
  donations: {
    newMessage: {
      amount: INumberMetadata;
      message: ITextMetadata;
    }
  },
  hosts: {
    newMessage: {
      min_viewers: INumberMetadata;
      message: ITextMetadata;
    }
  },
  raids: {
    newMessage: {
      amount: INumberMetadata;
      message: ITextMetadata;
    }
  }
}

interface INewAlertData {
  followers: {
    newMessage: string;
  };
  subscriptions: {
    newMessage: SubMessage;
  };
  donations: {
    newMessage: TipMessage;
  }
  hosts: {
    newMessage: HostMessage;
  }
  raids: {
    newMessage: RaidMessage;
  }
}


@Component({
  components: {
    TextInput,
    TextAreaInput,
    ListInput,
    NumberInput
  }
})
export default class ChatbotNewAlertModalWindow extends ChatbotAlertsBase {
  @Prop() selectedType: string;

  newAlert: INewAlertData = {
    followers: {
      newMessage: ''
    },
    subscriptions: {
      newMessage: {
        tier: 'prime',
        months: null,
        message: null,
        is_gifted: false
      }
    },
    donations: {
      newMessage: {
        amount: null,
        message: null
      }
    },
    hosts: {
      newMessage: {
        min_viewers: null,
        message: null
      }
    },
    raids: {
      newMessage: {
        amount: null,
        message: null
      }
    }
  };

  get title() {
    return `New ${this.selectedType} Alert`;
  }

  get isDonation() {
    return this.selectedType === 'donations';
  }

  get isSubscription() {
    return this.selectedType === 'subscriptions';
  }

  get isFollower() {
    return this.selectedType === 'followers';
  }

  get isHost() {
    return this.selectedType === 'hosts';
  }

  get isRaid() {
    return this.selectedType === 'raids';
  }

  get metadata() {
    const metadata: any = {
      followers: {
        newMessage: {
          required: true,
          placeholder: 'Message to follower'
        }
      },
      subscriptions: {
        newMessage: {
          tier: {
            placeholder: 'Suscription Tier',
            required: true,
            options: ['prime', 'tier_1', 'tier_2', 'tier_3'].map(tier => ({
              value: tier,
              title: tier.split('_').join(' ')
            }))
          },
          months: {
            required: true,
            placeholder: 'Number of months subscribed'
          },
          message: {
            required: true,
            placeholder: 'Message to subscriber'
          },
          is_gifted: {
            placeholder: 'Is Gifted?',
            required: true,
            options: ['yes', 'no'].map(isGifted => ({
              value: isGifted === 'yes',
              title: isGifted
            }))
          }
        }
      },
      donations: {
        newMessage: {
          amount: {
            min: 0,
            placeholder: 'Minimum amount'
          },
          message: {
            required: true,
            placeholder: 'Message to tipper'
          }
        }
      },
      hosts: {
        newMessage: {
          min_viewers: {
            min: 0,
            placeholder: 'Minimum viewer count'
          },
          message: {
            required: true,
            placeholder: 'Message to hosts'
          }
        }
      },
      raids: {
        newMessage: {
          amount: {
            min: 0,
            placeholder: 'Minimum amount'
          },
          message: {
            required: true,
            placeholder: 'Message to raider'
          }
        }
      }
    };
    return metadata;
  }
}