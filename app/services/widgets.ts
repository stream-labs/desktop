import { throttle } from 'lodash-decorators';
import { Service } from './service';
import { Inject } from '../util/injector';
import { UserService } from './user';
import { TPlatform } from './platforms';
import { ScenesService, SceneItem, Scene } from './scenes';
import { SourcesService } from './sources';
import { VideoService } from './video';
import { HostsService } from './hosts';
import { ScalableRectangle, AnchorPoint } from '../util/ScalableRectangle';
import namingHelpers from '../util/NamingHelpers';
import { Dictionary } from 'lodash';
import fs from 'fs';

export enum WidgetType {
  AlertBox = 0,
  DonationGoal = 1,
  FollowerGoal = 2,
  SubscriberGoal = 3,
  BitGoal = 4,
  DonationTicker = 5,
  ChatBox = 6,
  EventList = 7,
  TheJar = 8,
  ViewerCount = 9,
  StreamBoss = 10,
  Credits = 11,
  SpinWheel = 12
}

export interface ISerializableWidget {
  name: string;
  type: WidgetType;
  settings: Dictionary<any>;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

type TUrlGenerator = (
  host: string,
  token: string,
  platform: TPlatform
) => string;

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
      return `https://${host}/api/v5/slobs/test/${platform}_account/follow/${
        token
      }`;
    },
    platforms: ['twitch']
  },
  {
    name: 'Subscriber',
    url(host, token, platform) {
      return `https://${host}/api/v5/slobs/test/${platform}_account/follow/${
        token
      }`;
    },
    platforms: ['youtube']
  },
  {
    name: 'Subscription',
    url(host, token, platform) {
      return `https://${host}/api/v5/slobs/test/${
        platform
      }_account/subscription/${token}`;
    },
    platforms: ['twitch']
  },
  {
    name: 'Sponsor',
    url(host, token, platform) {
      return `https://${host}/api/v5/slobs/test/${
        platform
      }_account/subscription/${token}`;
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
      return `https://${host}/api/v5/slobs/test/${platform}_account/bits/${
        token
      }`;
    },
    platforms: ['twitch']
  },
  {
    name: 'Host',
    url(host, token, platform) {
      return `https://${host}/api/v5/slobs/test/${platform}_account/host/${
        token
      }`;
    },
    platforms: ['twitch']
  },
  {
    name: 'Super Chat',
    url(host, token, platform) {
      return `https://${host}/api/v5/slobs/test/${platform}_account/superchat/${
        token
      }`;
    },
    platforms: ['youtube']
  }
];

export class WidgetTester {
  constructor(public name: string, private url: string) {}

  @throttle(1000)
  test() {
    fetch(new Request(this.url));
  }
}

export interface IWidget {
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

  [WidgetType.FollowerGoal]: {
    name: 'Follower Goal',
    url(host, token) {
      return `https://${host}/widgets/follower-goal?token=${token}`;
    },

    width: 600,
    height: 200,

    x: 0,
    y: 1,

    anchor: AnchorPoint.SouthWest
  },

  [WidgetType.SubscriberGoal]: {
    name: 'Subscriber Goal',
    url(host, token) {
      return `https://${host}/widgets/follower-goal?token=${token}`;
    },

    width: 600,
    height: 200,

    x: 0,
    y: 1,

    anchor: AnchorPoint.SouthWest
  },

  [WidgetType.BitGoal]: {
    name: 'Bit Goal',
    url(host, token) {
      return `https://${host}/widgets/bit-goal?token=${token}`;
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
  },

  [WidgetType.ViewerCount]: {
    name: 'Viewer Count',
    url(host, token) {
      return `https://${host}/widgets/viewer-count?token=${token}`;
    },

    width: 600,
    height: 200,

    x: 0,
    y: 1,

    anchor: AnchorPoint.SouthWest
  },

  [WidgetType.StreamBoss]: {
    name: 'Bit Boss',
    url(host, token) {
      return `https://${host}/widgets/streamboss?token=${token}`;
    },

    width: 600,
    height: 200,

    x: 0,
    y: 1,

    anchor: AnchorPoint.SouthWest
  },

  [WidgetType.Credits]: {
    name: 'Credits',
    url(host, token) {
      return `https://${host}/widgets/end-credits?token=${token}`;
    },

    width: 600,
    height: 200,

    x: 0,
    y: 1,

    anchor: AnchorPoint.SouthWest
  },

  [WidgetType.SpinWheel]: {
    name: 'Spin Wheel',
    url(host, token) {
      return `https://${host}/widgets/wheel?token=${token}`;
    },

    width: 600,
    height: 600,

    x: 0,
    y: 1,

    anchor: AnchorPoint.SouthWest
  }
};

export class WidgetsService extends Service {
  @Inject() userService: UserService;
  @Inject() scenesService: ScenesService;
  @Inject() sourcesService: SourcesService;
  @Inject() hostsService: HostsService;
  @Inject() videoService: VideoService;

  createWidget(type: WidgetType, name?: string): SceneItem {
    if (!this.userService.isLoggedIn()) return;

    const scene = this.scenesService.activeScene;
    const widget = WidgetDefinitions[type];

    const suggestedName =
      name ||
      namingHelpers.suggestName(name || widget.name, (name: string) => {
        return this.sourcesService.getSourcesByName(name).length;
      });

    const source = this.sourcesService.createSource(
      suggestedName,
      'browser_source',
      {
        url: widget.url(
          this.hostsService.streamlabs,
          this.userService.widgetToken,
          this.userService.platform.type
        ),
        width: widget.width,
        height: widget.height
      },
      {
        propertiesManager: 'widget',
        propertiesManagerSettings: {
          widgetType: type
        }
      }
    );
    const sceneItem = scene.addSource(source.sourceId);

    // Give a couple seconds for the resize to propagate
    setTimeout(() => {
      const source = scene.getItem(sceneItem.sceneItemId);

      // Set the default transform
      const rect = new ScalableRectangle(source.getRectangle());

      rect.withAnchor(widget.anchor, () => {
        rect.x = widget.x * this.videoService.baseWidth;
        rect.y = widget.y * this.videoService.baseHeight;
      });

      source.setTransform({ position: {
        x: rect.x,
        y: rect.y
      }});
    }, 1500);

    return sceneItem;
  }

  getWidgetUrl(type: WidgetType) {
    if (!this.userService.isLoggedIn()) return;
    return WidgetDefinitions[type].url(
      this.hostsService.streamlabs,
      this.userService.widgetToken,
      this.userService.platform.type
    );
  }

  getTesters() {
    if (!this.userService.isLoggedIn()) return;
    return WidgetTesters.filter(tester => {
      return tester.platforms.includes(this.userService.platform.type);
    }).map(tester => {
      return new WidgetTester(
        tester.name,
        tester.url(
          this.hostsService.streamlabs,
          this.userService.widgetToken,
          this.userService.platform.type
        )
      );
    });
  }

  /**
   * Save a widget file to the given path
   * @param path the path to the save the widget file
   * @param widgetItemId the id of the widget to save
   */
  async saveWidgetFile(path: string, widgetItemId: string) {
    const widgetItem = this.scenesService.getSceneItem(widgetItemId);
    const data = this.exportWidgetJSON(widgetItem);
    const json = JSON.stringify(data, null, 2);

    await new Promise((resolve, reject) => {
      fs.writeFile(path, json, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Exports a serializable object representing the widget
   * which can be saved into a file and imported later.
   * @param widgetItem the SceneItem of the widget to export
   */
  private exportWidgetJSON(widgetItem: SceneItem): ISerializableWidget {
    const source = widgetItem.getSource();

    if (source.getPropertiesManagerType() !== 'widget') {
      throw new Error('Cannot export widget JSON for non-widget');
    }

    const settings = { ...source.getObsInput().settings };
    settings.url = '';

    return {
      name: source.name,
      type: source.getPropertiesManagerSettings().widgetType,
      settings,
      x: widgetItem.transform.position.x / this.videoService.baseWidth,
      y: widgetItem.transform.position.y / this.videoService.baseHeight,
      scaleX: widgetItem.transform.scale.x / this.videoService.baseWidth,
      scaleY: widgetItem.transform.scale.y / this.videoService.baseHeight
    };
  }

  /**
   * Load a widget file from the given path
   * @param path the path to the widget file to laod
   * @param sceneId the id of the scene to load into
   */
  async loadWidgetFile(path: string, sceneId: string) {
    const scene = this.scenesService.getScene(sceneId);
    const json = await new Promise<string>((resolve, reject) => {
      fs.readFile(path, (err, data) => {
        if (err) {
          reject();
        } else {
          resolve(data.toString());
        }
      });
    });

    const widget = JSON.parse(json);
    this.importWidgetJSON(widget, scene);
  }

  /**
   * Imports a serialized widget into a scene
   * @param widget the widget to import
   * @param scene the scene to import into
   */
  private importWidgetJSON(widget: ISerializableWidget, scene: Scene) {
    let widgetItem: SceneItem;

    // First, look for an existing widget of the same type
    widgetItem = scene.getItems().find(item => {
      const source = item.getSource();
      if (source.getPropertiesManagerType() !== 'widget') return false;
      if (source.getPropertiesManagerSettings().widgetType !== widget.type) return false;
      return true;
    });

    // Otherwise, create a new one
    if (!widgetItem) {
      widgetItem = scene.createAndAddSource(scene.name, 'browser_source');
    }

    const source = widgetItem.getSource();

    source.setName(widget.name);
    source.updateSettings(widget.settings);
    source.replacePropertiesManager('widget', { widgetType: widget.type });
    widgetItem.setTransform({
      position: {
        x: widget.x * this.videoService.baseWidth,
        y: widget.y * this.videoService.baseHeight,
      },
      scale: {
        x: widget.scaleX * this.videoService.baseWidth,
        y: widget.scaleY * this.videoService.baseHeight
      }
    });
  }
}
