import { Service, Inject } from './service';
import { UserService, requiresLogin } from './user';
import { TPlatform } from './platforms';
import { ScenesService } from './scenes';
import { SourcesService } from './sources';
import { IInputValue } from '../components/shared/forms/input';
import { HostsService } from './hosts';

export enum WidgetType {
  AlertBox,
  DonationGoal,
  DonationTicker,
  ChatBox,
  EventList,
  TheJar
}

type TUrlGenerator = (host: string, token: string, platform: TPlatform) => string;


export interface IWidgetTester {
  name: string;
  url: TUrlGenerator;

  // Which platforms this tester can be used on
  platforms: TPlatform[];
}

const WidgetTesters: IWidgetTester[] = [
  {
    name: 'Follow',
    url(host, token, platform) {
      return `https://${host}/api/v5/slobs/test/${platform}_account/follow/${token}`;
    },
    platforms: ['twitch', 'youtube']
  },
  {
    name: 'Subscription',
    url(host, token, platform) {
      return `https://${host}/api/v5/slobs/test/${platform}_account/subscription/${token}`;
    },
    platforms: ['twitch']
  },
  {
    name: 'Sponsor',
    url(host, token, platform) {
      return `https://${host}/api/v5/slobs/test/${platform}_account/subscription/${token}`;
    },
    platforms: ['youtube']
  },
  {
    name: 'Donation',
    url(host, token) {
      return `https://${host}/api/v5/slobs/test/streamlabs/donation/${token}`;
    },
    platforms: ['twitch', 'youtube']
  },
  {
    name: 'Bits',
    url(host, token, platform) {
      return `https://${host}/api/v5/slobs/test/${platform}_account/bits/${token}`;
    },
    platforms: ['twitch']
  },
  {
    name: 'Host',
    url(host, token, platform) {
      return `https://${host}/api/v5/slobs/test/${platform}_account/host/${token}`;
    },
    platforms: ['twitch']
  },
  {
    name: 'Super Chat',
    url(host, token, platform) {
      return `https://${host}/api/v5/slobs/test/${platform}_account/superchat/${token}`;
    },
    platforms: ['youtube']
  }
];


export class WidgetTester {

  constructor(public name: string, private url: string) {

  }

  test() {
    fetch(new Request(this.url));
  }

}


// TODO: Default width, height, and position
interface IWidget {
  name: string;
  url: TUrlGenerator;
}

export const WidgetDefinitions: { [x: number]: IWidget } = {
  [WidgetType.AlertBox]: {
    name: 'Alert Box',
    url(host, token) {
      return `https://${host}/alert-box/v3/${token}`;
    }
  },

  [WidgetType.DonationGoal]: {
    name: 'Donation Goal',
    url(host, token) {
      return `https://${host}/widgets/donation-goal?token=${token}`;
    }
  },

  [WidgetType.DonationTicker]: {
    name: 'Donation Ticker',
    url(host, token) {
      return `https://${host}/widgets/donation-ticker?token=${token}`;
    }
  },

  [WidgetType.ChatBox]: {
    name: 'Chat Box',
    url(host, token) {
      return `https://${host}/widgets/chat-box/v1/${token}`;
    }
  },

  [WidgetType.EventList]: {
    name: 'Event List',
    url(host, token) {
      return `https://${host}/widgets/event-list/v1/${token}`;
    }
  },

  [WidgetType.TheJar]: {
    name: 'The Jar',
    url(host, token) {
      return `https://${host}/widgets/tip-jar/v1/${token}`;
    }
  }
};



export class WidgetsService extends Service {

  @Inject()
  userService: UserService;

  @Inject()
  scenesService: ScenesService;

  @Inject()
  sourcesService: SourcesService;

  @Inject()
  hostsService: HostsService;

  // For now, we don't let you rename it
  @requiresLogin()
  createWidget(type: WidgetType) {
    const scene = this.scenesService.scenes[0];
    const widget = WidgetDefinitions[type];

    // TODO: Avoid name conflicts
    const sourceId = scene.addSource(widget.name, 'BrowserSource');
    const properties = this.sourcesService.getPropertiesFormData(sourceId);

    // Find the URL property and set it
    properties.forEach(prop => {
      if (prop.name === 'url') {
        prop.value = widget.url(
          this.hostsService.streamlabs,
          this.userService.widgetToken,
          this.userService.platform.type
        );
      }
    });

    this.sourcesService.setProperties(sourceId, properties);
  }

  @requiresLogin()
  getTesters() {
    return WidgetTesters.filter(tester => {
      return tester.platforms.includes(this.userService.platform.type);
    }).map(tester => {
      return new WidgetTester(tester.name, tester.url(
        this.hostsService.streamlabs,
        this.userService.widgetToken,
        this.userService.platform.type
      ));
    });
  }

}
