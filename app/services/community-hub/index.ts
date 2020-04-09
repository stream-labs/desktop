import uuid from 'uuid/v4';
import sample from 'lodash/sample';
import uniqBy from 'lodash/uniqBy';
import { StatefulService, mutation, ViewHandler } from 'services/core/stateful-service';
import { UserService, LoginLifecycle } from 'services/user';
import { HostsService } from 'services/hosts';
import { Inject } from 'services/core/injector';
import { I18nService, $t } from 'services/i18n';
import { InitAfter } from 'services/core';
import * as pages from 'components/pages/community-hub/pages';
import { handleResponse, authorizedHeaders } from 'util/requests';
import Utils from 'services/utils';

export interface IFriend {
  id: number;
  name: string;
  avatar: string;
  is_prime?: boolean;
  status?: string;
  is_friend?: boolean;
  chat_names?: Array<string>;
  game_streamed?: string;
}
interface IChatRoom {
  id: string;
  name: string;
  avatar: string;
  token?: string;
}

interface ICommunityHubState {
  connectedUsers: Dictionary<IFriend>;
  friendRequests: Array<IFriend>;
  chatrooms: Array<IChatRoom>;
  status: string;
  currentPage: string;
  self: IFriend;
}

const chatBgColor = () =>
  sample(['#2B5BD7', '#C22571', '#5E3BEC', '#758D14', '#36ADE0', '#EB7777', '#C57BFF', '#D5FF7B']);

const PAGES = () => ({
  matchmaking: { title: $t('Matchmaking'), component: pages.MatchmakeForm },
  friendsPage: { title: $t('Friends'), component: pages.FriendsPage },
});

class CommunityHubViews extends ViewHandler<ICommunityHubState> {
  get currentPage() {
    return PAGES()[this.state.currentPage] || { component: pages.ChatPage };
  }

  usersInRoom(roomName: string) {
    return Object.values(this.state.connectedUsers).filter(user =>
      user.chat_names.includes(roomName),
    );
  }

  userInRoom(userId: number, roomName: string) {
    return Object.values(this.state.connectedUsers).find(
      user => user.id === userId && user.chat_names.includes(roomName),
    );
  }

  get sortedFriends() {
    return Object.values(this.state.connectedUsers)
      .filter(friend => friend.is_friend)
      .sort((a, b) => {
        if (a.status === b.status) return 0;
        if (a.status === 'streaming' && b.status !== 'streaming') return -1;
        if (a.status === 'online' && b.status !== 'streaming') return -1;
        return 1;
      });
  }

  get onlineFriendCount() {
    return this.sortedFriends.filter(friend => friend.status !== 'offline').length;
  }

  get groupChats() {
    return this.state.chatrooms.filter(chatroom => this.usersInRoom(chatroom.id).length > 1);
  }

  get directMessages() {
    return this.state.chatrooms.filter(chatroom => this.usersInRoom(chatroom.id).length < 2);
  }

  get currentChat() {
    return this.state.chatrooms.find(chatroom => chatroom.id === this.state.currentPage);
  }

  findFriend(friendId: number) {
    return Object.values(this.state.connectedUsers).find(friend => friend.id === friendId);
  }

  get roomsToJoin() {
    return this.state.chatrooms.map(chatroom => ({ name: chatroom.name, token: chatroom.token }));
  }
}

@InitAfter('UserService')
export class CommunityHubService extends StatefulService<ICommunityHubState> {
  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;

  static initialState: ICommunityHubState = {
    connectedUsers: {},
    friendRequests: [],
    chatrooms: [],
    status: 'online',
    currentPage: 'matchmaking',
    self: {} as IFriend,
  };

  @mutation()
  ADD_USER(user: IFriend) {
    this.state.connectedUsers[user.id] = user;
  }

  @mutation()
  EDIT_USER(userId: number, patch: Partial<IFriend>) {
    const changedParams = Utils.getChangedParams(this.state.connectedUsers[userId], patch);
    this.state.connectedUsers[userId] = {
      ...this.state.connectedUsers[userId],
      ...changedParams,
      chat_names: this.state.connectedUsers[userId].chat_names.concat(patch.chat_names),
    };
  }

  @mutation()
  REMOVE_FRIEND(friendId: number) {
    this.state.connectedUsers[friendId].is_friend = false;
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
    // this.getFriends();
    // this.getFriendRequests();
    // this.getChatrooms();
    // Promise.all(this.state.chatrooms.map(async room => await this.getChatMembers(room.id)));
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
    const mappedFriends = resp.data.map((friend: IFriend) => ({
      chat_names: [] as Array<string>,
      is_friend: true,
      ...friend,
    }));
    this.updateUsers(mappedFriends);
  }

  async getChatMembers(chatroomName: string) {
    const resp = await this.getResponse(`group/members?groupId=${chatroomName}`);
    this.updateUsers(resp.data.map((user: IFriend) => ({ chat_names: [chatroomName], ...user })));
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

  updateUsers(users: Array<IFriend>) {
    users.forEach(user => {
      if (!this.state.connectedUsers[user.id]) {
        this.ADD_USER(user);
      } else {
        this.EDIT_USER(user.id, user);
      }
    });
  }

  setPage(page: string) {
    this.SET_CURRENT_PAGE(page);
  }

  addDm(friendId: number) {
    const friend = this.views.findFriend(friendId);
    const id = uuid();
    this.ADD_CHATROOM({
      id,
      name: friend.name,
      avatar: friend.avatar,
    });
    this.setPage(id);
  }

  addChat(name: string, avatar?: string) {
    const imageOrCode = avatar || chatBgColor();
    const id = uuid();
    this.ADD_CHATROOM({ id, name, avatar: imageOrCode });
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
