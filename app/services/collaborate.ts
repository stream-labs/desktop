import Vue from 'vue';
import sample from 'lodash/sample';
import { StatefulService, mutation, ViewHandler } from 'services/core/stateful-service';
import { UserService, LoginLifecycle } from 'services/user';
import { HostsService } from 'services/hosts';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { InitAfter } from 'services/core';
import { handleResponse, authorizedHeaders } from 'util/requests';
import Utils from 'services/utils';

export interface IFriend {
  id: number;
  name: string;
  avatar: string;
  is_prime?: boolean;
  user_id?: number;
  status: string;
  is_friend?: boolean;
  chat_names?: Array<string>;
  game_streamed?: string;
}
export interface IChatRoom {
  name: string;
  title: string;
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


class CommunityHubViews extends ViewHandler<ICommunityHubState> {
  usersInRoom(roomName?: string) {
    if (!roomName) return [];
    return Object.values(this.state.connectedUsers).filter(
      user => user.chat_names.includes(roomName) && user.id !== this.state.self.id,
    );
  }

  userInRoom(userId: number, roomName: string) {
    return this.state.connectedUsers[userId]?.chat_names?.includes(roomName);
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
    return this.state.chatrooms.filter(chatroom => this.usersInRoom(chatroom.name).length > 1);
  }

  get directMessages() {
    return this.state.chatrooms.filter(chatroom => this.usersInRoom(chatroom.name).length < 2);
  }

  get currentChat() {
    return this.state.chatrooms.find(chatroom => chatroom.name === this.state.currentPage);
  }

  findFriend(friendId: number) {
    return Object.values(this.state.connectedUsers).find(friend => friend.id === friendId);
  }

  get roomsToJoin() {
    if (!this.state.chatrooms) return [];
    return this.state.chatrooms.map(chatroom => ({
      name: chatroom.name,
      token: chatroom.token,
      type: 'dm',
    }));
  }
}

@InitAfter('UserService')
export class CollaborateService extends StatefulService<ICommunityHubState> {
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
    Vue.set(this.state.connectedUsers, user.id, user);
  }

  @mutation()
  EDIT_USER(userId: number, patch: Partial<IFriend>) {
    const changedParams = Utils.getChangedParams(this.state.connectedUsers[userId], patch);
    const chatNames = this.state.connectedUsers[userId].chat_names;
    Vue.set(this.state.connectedUsers, userId, {
      ...this.state.connectedUsers[userId],
      ...changedParams,
      chat_names: chatNames ? chatNames.concat(patch.chat_names) : [],
    });
  }

  @mutation()
  SET_FRIEND_REQUESTS(friendRequests: Array<IFriend>) {
    this.state.friendRequests = friendRequests;
  }

  @mutation()
  ADD_CHATROOM(chatroom: IChatRoom) {
    this.state.chatrooms.push(chatroom);
  }

  @mutation()
  LEAVE_CHATROOM(chatroomName: string) {
    this.state.chatrooms = this.state.chatrooms.filter(chatroom => chatroom.name !== chatroomName);
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
    await this.getFriends();
    // await this.getFriendRequests();
    await this.getChatrooms();
    // Promise.all(this.state.chatrooms.map(room => this.getChatMembers(room.name)));
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
    const request = new Request(url, { headers, body: JSON.stringify(body), method: 'POST' });
    return await fetch(request).then(handleResponse);
  }

  async getFriends(): Promise<IFriend[]> {
    return [];
  }

  getChatMembers(chatroomName: string) {
    return [
      {
        id: 1,
        name: 'nate',
        user_id: 1,
        status: 'online',
        is_friend: false,
      },
      {
        id: 2,
        name: 'dylan',
        user_id: 2,
        status: 'online',
        is_friend: false,
      },
      {
        id: 3,
        name: 'PirateSoftware',
        user_id: 3,
        status: 'offline',
        is_friend: false,
      },
      {
        id: 4,
        name: 'amber',
        user_id: 4,
        status: 'online',
        is_friend: false,
      },
      {
        id: 5,
        name: 'Ludwig',
        user_id: 5,
        status: 'offline',
        is_friend: false,
      },
      {
        id: 6,
        name: 'anna',
        user_id: 6,
        status: 'online',
        is_friend: false,
      },
    ];
  }

  async sendFriendRnequest(friendId: number) {
    this.postResponse('friend/request', { friendId });
  }

  async sendFriendRequestByName(name: string) {
    const platform = this.userService.platform.type;
    try {
      this.postResponse('friend/request', { [`${platform}Id`]: name });
    } catch (e) {
      return Promise.reject($t('No user found with that name'));
    }
  }

//   async getFriendRequests() {
//     const resp = await this.getResponse('friend/request');
//     this.SET_FRIEND_REQUESTS(resp.data);
//   }

  async respondToFriendRequest(request: IFriend, accepted: boolean) {
    const endpoint = `friend/${accepted ? 'accept' : 'reject'}`;
    this.postResponse(endpoint, { requestId: request.id });
    if (accepted) {
      this.updateUsers([
        { ...request, is_friend: true, chat_names: [], status: 'offline', id: request.user_id },
      ]);
    }
    const filteredRequests = this.state.friendRequests.filter(req => req.id !== request.id);
    this.SET_FRIEND_REQUESTS(filteredRequests);
  }

  addFriendRequest(friendRequest: IFriend) {
    this.SET_FRIEND_REQUESTS([friendRequest, ...this.state.friendRequests]);
  }

  async unfriend(friend: IFriend) {
    this.postResponse('friend/remove', { friendId: friend.id });
    this.updateUsers([{ ...friend, is_friend: false }]);
  }

  async getChatrooms() {
    [].forEach((chatroom: IChatRoom) => this.addChat(chatroom, false));
  }

  async leaveChatroom(groupId: string) {
    this.postResponse('group/leave', { groupId });
    this.LEAVE_CHATROOM(groupId);
  }

  updateUsers(users: Array<IFriend>) {
    users.forEach(user => {
      if (user.id === this.self.id) return;
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

  async createChat(title: string, members: Array<IFriend>) {
    const membos = this.getChatMembers('');
    this.updateUsers(membos.map(member => ({ ...member, chat_names: ['Comfy Card Dads'] })));
    this.addChat({
      name: 'Comfy Card Dads',
      title: 'Comfy Card Dads',
      avatar: null,
    });
  }

  addChat(chatroom: IChatRoom, navigate = true) {
    const imageOrCode = chatroom.avatar || chatBgColor();
    this.ADD_CHATROOM({ ...chatroom, avatar: imageOrCode });
    if (navigate) {
      this.setPage(chatroom.name);
    }
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
