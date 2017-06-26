import { Service, Inject } from './service';
import { UserService, requiresLogin } from './user';
import { TPlatform } from './platforms';
import { ScenesService } from './scenes';
import { SourcesService } from './sources';
import { VideoService } from './video';
import { IInputValue } from '../components/shared/forms/input';
import { HostsService } from './hosts';
import { ScalableRectangle, AnchorPoint } from '../util/ScalableRectangle';

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

  // Default transform for the widget
  width: number;
  height: number;

  // These are relative, so they will adjust to the
  // canvas resolution.  Valid values are between 0 and 1.
  x: number;
  y: number;

  // An anchor (origin) point can be specified for the x&y positions
  anchor: AnchorPoint;
}

export const WidgetDefinitions: { [x: number]: IWidget } = {
  [WidgetType.AlertBox]: {
    name: 'Alert Box',
    url(host, token) {
      return `https://${host}/alert-box/v3/${token}`;
    },

    width: 800,
    height: 600,

    x: 0.5,
    y: 0,

    anchor: AnchorPoint.North
  },

  [WidgetType.DonationGoal]: {
    name: 'Donation Goal',
    url(host, token) {
      return `https://${host}/widgets/donation-goal?token=${token}`;
    },

    width: 600,
    height: 200,

    x: 0,
    y: 1,

    anchor: AnchorPoint.SouthWest
  },

  [WidgetType.DonationTicker]: {
    name: 'Donation Ticker',
    url(host, token) {
      return `https://${host}/widgets/donation-ticker?token=${token}`;
    },

    width: 600,
    height: 200,

    x: 1,
    y: 1,

    anchor: AnchorPoint.SouthEast
  },

  [WidgetType.ChatBox]: {
    name: 'Chat Box',
    url(host, token) {
      return `https://${host}/widgets/chat-box/v1/${token}`;
    },

    width: 600,
    height: 600,

    x: 0,
    y: 0.5,

    anchor: AnchorPoint.West
  },

  [WidgetType.EventList]: {
    name: 'Event List',
    url(host, token) {
      return `https://${host}/widgets/event-list/v1/${token}`;
    },

    width: 600,
    height: 600,

    x: 1,
    y: 0,

    anchor: AnchorPoint.NorthEast
  },

  [WidgetType.TheJar]: {
    name: 'The Jar',
    url(host, token) {
      return `https://${host}/widgets/tip-jar/v1/${token}`;
    },

    width: 600,
    height: 600,

    x: 1,
    y: 0.5,

    anchor: AnchorPoint.East
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

  @Inject()
  videoService: VideoService;

  // For now, we don't let you rename it
  @requiresLogin()
  createWidget(type: WidgetType) {
    const scene = this.scenesService.scenes[0];
    const widget = WidgetDefinitions[type];

    // TODO: Avoid name conflicts
    const sourceId = scene.addSource(widget.name, 'BrowserSource');
    const properties = this.sourcesService.getPropertiesFormData(sourceId);

    console.log(properties);

    // Find the URL property and set it
    properties.forEach(prop => {
      if (prop.name === 'url') {
        prop.value = widget.url(
          this.hostsService.streamlabs,
          this.userService.widgetToken,
          this.userService.platform.type
        );
      }

      if (prop.name === 'width') {
        prop.value = widget.width;
      }

      if (prop.name === 'height') {
        prop.value = widget.height;
      }
    });

    this.sourcesService.setProperties(sourceId, properties);

    // Give a couple reconds for the resize to propagate
    setTimeout(() => {
      const source = scene.getSource(sourceId);

      // Set the default transform
      const rect = new ScalableRectangle(source);

      rect.withAnchor(widget.anchor, () => {
        rect.x = widget.x * this.videoService.baseWidth;
        rect.y = widget.y * this.videoService.baseHeight;
      });

      source.setPosition({
        x: rect.x,
        y: rect.y
      });
    }, 1500);
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
