import Vue from 'vue';
import { Subscription } from 'rxjs';
import { StatefulService, mutation, ViewHandler } from 'services/core/stateful-service';
import { Inject } from 'services/core/injector';
import { InitAfter } from 'services/core';
import { CollaborateService, IFriend, IChatRoom } from './collaborate';
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
  messageSocketConnection: Subscription = null;
  internalEventSocketConnection: Subscription = null;
  roomUpdateSocketConnection: Subscription = null;

  async subscribeToSocketConnections() {
    // this.messageSocketConnection = this.chatWebsocketService.chatMessageEvent.subscribe(ev =>
    //   this.recieveMessage(ev.data, ev.user),
    // );
    // this.internalEventSocketConnection = this.chatWebsocketService.internalEvent.subscribe(ev => {
    //   this.handleInternalEvent(ev);
    // });
    // this.roomUpdateSocketConnection = this.chatWebsocketService.roomUpdateEvent.subscribe(ev => {
    //   if (ev.action === 'new_member') {
    //     this.chatWebsocketService.sendStatusUpdate('online', null, ev.room.name);
    //     this.communityHubService.getChatMembers(ev.room.name);
    //   }
    // });
  }

  async unsubscribeFromSocketConnections() {
    if (this.messageSocketConnection) this.messageSocketConnection.unsubscribe();
    if (this.internalEventSocketConnection) this.internalEventSocketConnection.unsubscribe();
    if (this.roomUpdateSocketConnection) this.roomUpdateSocketConnection.unsubscribe();
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
  }
}
