import uuid from 'uuid/v4';
import sample from 'lodash/sample';
import { StatefulService, mutation, ViewHandler } from 'services/core/stateful-service';
import { UserService, LoginLifecycle } from 'services/user';
import { HostsService } from 'services/hosts';
import { Inject } from 'services/core/injector';
import { I18nService, $t } from 'services/i18n';
import { InitAfter } from 'services/core';
import * as pages from 'components/pages/community-hub/pages';
import { handleResponse, authorizedHeaders } from 'util/requests';

export interface IFriend {
  id: number;
  name: string;
  avatar: string;
  is_prime?: boolean;
  status?: string;
  date_friended?: string;
  game_streamed?: string;
}
interface IChatRoom {
  id: string;
  name: string;
  members: Array<IFriend>;
  avatar: string;
}

interface ICommunityHubState {
  friends: Array<IFriend>;
  friendRequests: Array<IFriend>;
  chatrooms: Array<IChatRoom>;
  status: string;
  currentPage: string;
  self: IFriend;
}

const PAGES = () => ({
  matchmaking: { title: $t('Matchmaking'), component: pages.MatchmakeForm },
  friendsPage: { title: $t('Friends'), component: pages.FriendsPage },
});

class CommunityHubViews extends ViewHandler<ICommunityHubState> {
  get currentPage() {
    return PAGES()[this.state.currentPage] || { component: pages.ChatPage };
  }

  get sortedFriends() {
    return this.state.friends.sort((a, b) => {
      if (a.status === b.status) return 0;
      if (a.status === 'streaming' && b.status !== 'streaming') return -1;
      if (a.status === 'online' && b.status !== 'streaming') return -1;
      return 1;
    });
  }

  get groupChats() {
    return this.state.chatrooms.filter(chatroom => chatroom.members.length > 1);
  }

  get directMessages() {
    return this.state.chatrooms.filter(chatroom => chatroom.members.length < 2);
  }

  get currentChat() {
    return this.state.chatrooms.find(chatroom => chatroom.id === this.state.currentPage);
  }

  findFriend(friendId: number) {
    return this.state.friends.find(friend => friend.id === friendId);
  }
}

@InitAfter('UserService')
export class CommunityHubService extends StatefulService<ICommunityHubState> {
  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;
  @Inject() private i18nService: I18nService;

  static initialState: ICommunityHubState = {
    friends: [],
    friendRequests: [],
    chatrooms: [],
    status: 'online',
    currentPage: 'matchmaking',
    self: {} as IFriend,
  };

  @mutation()
  SET_FRIENDS(friends: Array<IFriend>) {
    this.state.friends = friends;
  }

  @mutation()
  REMOVE_FRIEND(friendId: number) {
    this.state.friends = this.state.friends.filter(friend => friend.id !== friendId);
  }

  @mutation()
  SET_FRIEND_REQUESTS(friendRequests: Array<IFriend>) {
    this.state.friendRequests = friendRequests;
  }

  @mutation()
  SET_CHATROOMS(chatrooms: Array<IChatRoom>) {
    this.state.chatrooms = chatrooms;
  }

  @mutation()
  ADD_CHATROOM(chatroom: IChatRoom) {
    this.state.chatrooms.push(chatroom);
  }

  @mutation()
  LEAVE_CHATROOM(chatroomName: string) {
    this.state.chatrooms = this.state.chatrooms.filter(chatroom => chatroom.id !== chatroomName);
  }

  @mutation()
  SET_CURRENT_PAGE(page: string) {
    this.state.currentPage = page;
  }

  @mutation()
  SET_SELF(self: IFriend) {
    this.state.self = self;
  }

  lifecycle: LoginLifecycle;

  async init() {
    this.lifecycle = await this.userService.withLifecycle({
      init: this.fetchUserData,
      destroy: () => Promise.resolve(),
      context: this,
    });
  }

  async fetchUserData() {
    this.getFriends();
    this.getFriendRequests();
    this.getChatrooms();
  }

  async getResponse(endpoint: string) {
    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs-chat/${endpoint}`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });
    return await fetch(request).then(handleResponse);
  }

  async postResponse(endpoint: string, body?: any) {
    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs-chat/${endpoint}`;
    const headers = authorizedHeaders(
      this.userService.apiToken,
      new Headers({ 'Content-Type': 'application/json' }),
    );
    const request = new Request(url, { headers, body, method: 'POST' });
    return await fetch(request).then(handleResponse);
  }

  async getFriends() {
    const resp = await this.getResponse('friends');
    this.SET_FRIENDS(resp.data);
  }

  async getChatMembers(chatroomName: string) {
    const resp = await this.getResponse(`group/members?groupId=${chatroomName}`);
    return resp.data;
  }

  async sendFriendRequest(friendId: number) {
    this.postResponse('friend/request', { friendId });
  }

  async getFriendRequests() {
    const resp = await this.getResponse('friend/request');
    this.SET_FRIEND_REQUESTS(resp.data);
  }

  async respondToFriendRequest(requestId: number, accepted: boolean) {
    const endpoint = `friend/${accepted ? 'accept' : 'reject'}`;
    this.postResponse(endpoint, { requestId });
  }

  async unfriend(friendId: number) {
    this.postResponse('friend/remove', { friendId });
    this.REMOVE_FRIEND(friendId);
  }

  async getChatrooms() {
    const resp = await this.getResponse('settings');
    this.SET_CHATROOMS(resp.chatrooms);
  }

  async leaveChatroom(groupId: string) {
    this.postResponse('group/leave', { groupId });
    this.LEAVE_CHATROOM(groupId);
  }

  chatBgColor() {
    return sample([
      '#2B5BD7',
      '#C22571',
      '#5E3BEC',
      '#758D14',
      '#36ADE0',
      '#EB7777',
      '#C57BFF',
      '#D5FF7B',
    ]);
  }

  setPage(page: string) {
    this.SET_CURRENT_PAGE(page);
  }

  addDm(friendId: number) {
    const friend = this.views.findFriend(friendId);
    const id = uuid();
    this.ADD_CHATROOM({
      id,
      members: [friend],
      name: friend.name,
      avatar: friend.avatar,
    });
    this.setPage(id);
  }

  addChat(members: Array<IFriend>, name: string, avatar?: string) {
    const imageOrCode = avatar || this.chatBgColor();
    const id = uuid();
    this.ADD_CHATROOM({ id, members, name, avatar: imageOrCode });
    this.setPage(id);
  }

  get views() {
    return new CommunityHubViews(this.state);
  }

  get self(): IFriend {
    return this.state.self;
  }

  set self(self: IFriend) {
    this.SET_SELF(self);
  }
}
