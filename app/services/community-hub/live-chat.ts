import Vue from 'vue';
import { Subscription } from 'rxjs';
import { StatefulService, mutation, ViewHandler } from 'services/core/stateful-service';
import { Inject } from 'services/core/injector';
import { InitAfter } from 'services/core';
import { ChatWebsocketService } from './chat-websocket';
import { CommunityHubService, IFriend } from '.';
import { UserService, LoginLifecycle } from 'services/user';

export interface IMessage {
  user_id: number;
  room: string;
  message: string;
  display_name: string;
  avatar: string;
  date_posted?: string;
}

interface ILiveChatState {
  messages: Dictionary<Array<IMessage>>;
}

class LiveChatViews extends ViewHandler<ILiveChatState> {
  messages(chatId: string) {
    if (!this.state.messages[chatId]) return [];
    return this.state.messages[chatId];
  }
}

@InitAfter('UserService')
export class LiveChatService extends StatefulService<ILiveChatState> {
  @Inject() private chatWebsocketService: ChatWebsocketService;
  @Inject() private communityHubService: CommunityHubService;
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
  messageSocketConnection: Subscription = null;
  internalEventSocketConnection: Subscription = null;

  async subscribeToSocketConnections() {
    this.messageSocketConnection = this.chatWebsocketService.chatMessageEvent.subscribe(ev =>
      this.recieveMessage(ev.data, ev.user),
    );
    this.internalEventSocketConnection = this.chatWebsocketService.internalEvent.subscribe(ev => {
      if (ev.action === 'status_update') {
        this.updateStatus(ev.data.user, ev.data.status);
      }
    });
  }

  async unsubscribeFromSocketConnections() {
    if (this.messageSocketConnection) this.messageSocketConnection.unsubscribe();
    if (this.internalEventSocketConnection) this.internalEventSocketConnection.unsubscribe();
  }

  updateStatus(user: IFriend, status: string) {
    this.communityHubService.updateUsers([{ ...user, status }]);
  }

  sendStatusUpdate(status: string, game?: string) {
    this.chatWebsocketService.sendStatusUpdate(status, game);
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

  sendMessage(chatId: string, message: string) {
    const messageObj = {
      user_id: this.communityHubService.self.id,
      room: chatId,
      display_name: this.communityHubService.self.name,
      avatar: this.communityHubService.self.avatar,
      date_posted: Date.now().toLocaleString(),
      message,
    };

    this.ADD_MESSAGE(chatId, messageObj);
    this.chatWebsocketService.sendMessage({ room: chatId, message });
  }
}
