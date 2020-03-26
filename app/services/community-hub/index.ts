import { StatefulService, mutation, ViewHandler } from 'services/core/stateful-service';
import { UserService } from 'services/user';
import { HostsService } from 'services/hosts';
import { Inject } from 'services/core/injector';
import { I18nService, $t } from 'services/i18n';
import { InitAfter } from 'services/core';
import * as pages from 'components/pages/community-hub/pages';

// TODO: replace with real data
import { friends, chatRooms, self } from './STUB_DATA';

export interface IFriend {
  id: string;
  username: string;
  avatar: string;
  status: string;
  date_friended?: string;
  game_streamed?: string;
  is_prime?: boolean;
}
interface IChatRoom {
  id: string;
  name: string;
  members: Array<IFriend>;
  avatar: string;
}

interface ICommunityHubState {
  friends: Array<IFriend>;
  chatrooms: Array<IChatRoom>;
  status: string;
  currentPage: string;
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

  findFriend(friendId: string) {
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
    chatrooms: [],
    status: 'online',
    currentPage: 'matchmaking',
  };

  @mutation()
  SET_FRIENDS(friends: Array<IFriend>) {
    this.state.friends = friends;
  }

  @mutation()
  SET_CHATROOMS(chatrooms: Array<IChatRoom>) {
    this.state.chatrooms = chatrooms;
  }

  @mutation()
  SET_CURRENT_PAGE(page: string) {
    this.state.currentPage = page;
  }

  init() {
    this.SET_FRIENDS(friends);
    this.SET_CHATROOMS(chatRooms);
  }

  setPage(page: string) {
    this.SET_CURRENT_PAGE(page);
  }

  get views() {
    return new CommunityHubViews(this.state);
  }

  get self(): IFriend {
    return self;
  }
}
