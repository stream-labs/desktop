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
  ISubAlertMessage,
  ITipMessage,
  IHostMessage,
  IRaidMessage,
} from 'services/chatbot/chatbot-interfaces';

interface ISubMessage extends ISubAlertMessage {
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
      is_gifted: IListMetadata<boolean>;
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
    newMessage: ISubMessage;
  };
  donations: {
    newMessage: ITipMessage;
  }
  hosts: {
    newMessage: IHostMessage;
  }
  raids: {
    newMessage: IRaidMessage;
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

  onSubmit: Function = () => {};

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
    const metadata: INewAlertMetadata = {
      followers: {
        newMessage: {
          required: true,
          placeholder: 'Message to follower'
        }
      },
      subscriptions: {
        newMessage: {
          tier: {
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
            placeholder: 'Message to donator'
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

  bindOnSubmitAndCheckIfEdited(event: any) {
    const { onSubmit, editedAlert } = event.params;
    this.onSubmit = onSubmit;
    if (editedAlert) {
      if (this.selectedType === 'followers') {
        this.newAlert[this.selectedType].newMessage = editedAlert.message;
        return;
      }

      this.newAlert[this.selectedType].newMessage = editedAlert;
    }
  }

  cancel() {
    this.$modal.hide('new-alert');
  }

  submit() {
    this.onSubmit(this.newAlert[this.selectedType].newMessage);
  }
}