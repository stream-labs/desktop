import { StatefulService, mutation } from 'services/core/stateful-service';
import { UserService } from 'services/user';
import { HostsService } from 'services/hosts';
import { Inject } from 'services/core/injector';
import { I18nService } from 'services/i18n';

interface ICommunityHubState {}

export class CommunityHubService extends StatefulService<ICommunityHubState> {
  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;
  @Inject() private i18nService: I18nService;

  static initialState: ICommunityHubState = {};
}
