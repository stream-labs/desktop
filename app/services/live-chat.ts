import Vue from 'vue';
import { ipcRenderer } from 'electron';
import { Subscription } from 'rxjs';
import Pusher, { Channel } from 'pusher-js';
import { StatefulService, mutation, ViewHandler } from 'services/core/stateful-service';
import { Inject } from 'services/core/injector';
import { InitAfter } from 'services/core';
import { CollaborateService, IFriend, IChatRoom } from './collaborate';
import { UserService, LoginLifecycle } from 'services/user';
import uuid from 'uuid';

export interface IMessage {
  user_id: number;
  room: string;
  message: string;
  display_name: string;
  avatar: string;
  date_posted?: string;
}

interface IMessageData {
  id: string;
  timestamp: number;
  author: string;
  message: string;
  flagged: boolean;
}

interface ILiveChatState {
  messages: Dictionary<Array<IMessage>>;
}

const PUSHER_APP_KEY = '8d2ee88ba341ba678124';
const PUSHER_APP_CLUSTER = 'us2';
const PUSHER_MESSAGE_CHANNEL = 'messages';
const PUSHER_MESSAGE_EVENT = 'new-message';

class LiveChatViews extends ViewHandler<ILiveChatState> {
  messages(chatId: string) {
    if (!this.state.messages[chatId]) return [];
    return this.state.messages[chatId];
  }
}

@InitAfter('UserService')
export class LiveChatService extends StatefulService<ILiveChatState> {
  @Inject() private collaborateService: CollaborateService;
  @Inject() private userService: UserService;

  static initialState: ILiveChatState = {
    messages: {},
  };

  @mutation()
  ADD_MESSAGE(chatId: string, message: IMessage) {
    if (!this.state.messages[chatId]) Vue.set(this.state.messages, chatId, []);
    this.state.messages[chatId].push(message);
  }

  @mutation()
  DESTROY_CHAT(chatId: string) {
    Vue.delete(this.state.messages, chatId);
  }

  @mutation()
  LOAD_MESSAGES(messages: Dictionary<Array<IMessage>>) {
    this.state.messages = messages;
  }

  async init() {
    this.lifecycle = await this.userService.withLifecycle({
      init: this.subscribeToSocketConnections,
      destroy: this.unsubscribeFromSocketConnections,
      context: this,
    });
  }

  get views() {
    return new LiveChatViews(this.state);
  }

  lifecycle: LoginLifecycle;
  messageSocketConnection: Channel = null;
  internalEventSocketConnection: Subscription = null;
  roomUpdateSocketConnection: Subscription = null;

  async subscribeToSocketConnections() {
    const pusher = new Pusher(PUSHER_APP_KEY, {
      cluster: PUSHER_APP_CLUSTER,
    })
    this.messageSocketConnection = pusher.subscribe(PUSHER_MESSAGE_CHANNEL);
    this.messageSocketConnection.bind(PUSHER_MESSAGE_EVENT, (data: IMessageData) => {
      const user = this.collaborateService.getChatMembers('').find(member => member.name === data.author);
      this.recieveMessage({
        room: 'brainrotters unite',
        message: data.message,
      }, {
        id: 2,
        name: data.author,
        status: 'online',
        avatar: user ? user.avatar : '',
      });
    });
  }

  async unsubscribeFromSocketConnections() {
    if (this.messageSocketConnection) this.messageSocketConnection.unsubscribe();
    // if (this.internalEventSocketConnection) this.internalEventSocketConnection.unsubscribe();
    // if (this.roomUpdateSocketConnection) this.roomUpdateSocketConnection.unsubscribe();
  }

  updateStatus(user: IFriend, status: string) {
    this.collaborateService.actions.updateUsers([{ ...user, status }]);
  }

  recieveMessage(messageObj: Partial<IMessage>, user: IFriend) {
    const message = {
      user_id: user.id,
      display_name: user.name,
      room: messageObj.room,
      message: messageObj.message,
      avatar: user.avatar,
      date_posted: Date.now().toLocaleString(),
    };

    this.ADD_MESSAGE(messageObj.room, message);
  }

  sendMessage(message: string) {
    this.ADD_MESSAGE('brainrotters unite', {
      user_id: 0,
      display_name: 'toasthammer',
      room: 'brainrotters unite',
      message,
      avatar: 'https://framecloud-public.s3.amazonaws.com/hackathon-avatars/channels4_profile.jpg',
      date_posted: Date.now().toLocaleString(),
    });
  }
}
