import { Service, Inject } from './service';
import { UserService, requiresLogin } from './user';
import { ScenesService } from './scenes';
import { SourcesService } from './sources';
import { IInputValue } from '../components/shared/forms/input';

export enum WidgetType {
  AlertBox,
  DonationGoal,
  DonationTicker,
  ChatBox,
  EventList,
  TheJar
}

// TODO: Default width, height, and position
interface IWidget {
  name: string;
  urlGenerator: (host: string, token: string) => string;
}

export const WidgetDefinitions: { [x: number]: IWidget } = {
  [WidgetType.AlertBox]: {
    name: 'Alert Box',
    urlGenerator(host, token) {
      return `https://${host}/alert-box/v3/${token}`;
    }
  },

  [WidgetType.DonationGoal]: {
    name: 'Donation Goal',
    urlGenerator(host, token) {
      return `https://${host}/widgets/donation-goal?token=${token}`;
    }
  },

  [WidgetType.DonationTicker]: {
    name: 'Donation Ticker',
    urlGenerator(host, token) {
      return `https://${host}/widgets/donation-ticker?token=${token}`;
    }
  },

  [WidgetType.ChatBox]: {
    name: 'Chat Box',
    urlGenerator(host, token) {
      return `https://${host}/widgets/chat-box/v1/${token}`;
    }
  },

  [WidgetType.EventList]: {
    name: 'Event List',
    urlGenerator(host, token) {
      return `https://${host}/widgets/event-list/v1/${token}`;
    }
  },

  [WidgetType.TheJar]: {
    name: 'The Jar',
    urlGenerator(host, token) {
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
        prop.value = widget.urlGenerator('streamlabs.com', this.userService.widgetToken);
      }
    });

    this.sourcesService.setProperties(sourceId, properties);
  }

}
