import Vue from 'vue';
import uuid from 'uuid/v4';
import { StatefulService, mutation, ViewHandler } from 'services/core/stateful-service';
import { UserService } from 'services/user';
import { HostsService } from 'services/hosts';
import { Inject } from 'services/core/injector';
import { I18nService } from 'services/i18n';
import { InitAfter } from 'services/core';
import { ChatWebsocketService } from './chat-websocket';
import { CommunityHubService } from '.';

export interface IMessage {
  id: string;
  user_id: number;
  chat_id: string;
  content: string;
  name: string;
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
  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;
  @Inject() private i18nService: I18nService;
  @Inject() private communityHubService: CommunityHubService;

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

  init() {}

  get views() {
    return new LiveChatViews(this.state);
  }

  sendMessage(chatId: string, content: string) {
    const messageObj = {
      id: uuid(),
      user_id: this.communityHubService.self.id,
      chat_id: chatId,
      name: this.communityHubService.self.name,
      avatar: this.communityHubService.self.avatar,
      content,
    };

    this.ADD_MESSAGE(chatId, messageObj);
  }
}
