import { AnchorPoint } from '../../util/ScalableRectangle';
import { TAlertType } from './alerts-config';
import { WidgetType } from './widgets-data';

export type TWidgetType = WidgetType.AlertBox | WidgetType.ViewerCount | WidgetType.GameWidget | WidgetType.EmoteWall;

export interface IWidgetConfig {
  type: TWidgetType;

  // Default transform for the widget
  defaultTransform: {
    width: number;
    height: number;

    // These are relative, so they will adjust to the
    // canvas resolution.  Valid values are between 0 and 1.
    x: number;
    y: number;

    // An anchor (origin) point can be specified for the x&y positions
    anchor: AnchorPoint;
  };

  url: string;
  dataFetchUrl: string;
  settingsSaveUrl: string;
  previewUrl: string;
  settingsUpdateEvent: string;
  testers?: TAlertType[];
  customCodeAllowed?: boolean;
  customFieldsAllowed?: boolean;

  // the settings window size
  // the default size is 600x800
  settingsWindowSize?: {
    width: number;
    height: number;
  };
}

export function getWidgetsConfig(host: string, token: string): Record<TWidgetType, IWidgetConfig> {
  return {
    [WidgetType.AlertBox]: {
      type: WidgetType.AlertBox,

      defaultTransform: {
        width: 800,
        height: 600,
        x: 0.5,
        y: 0,
        anchor: AnchorPoint.North,
      },

      settingsWindowSize: {
        width: 850,
        height: 940,
      },

      url: `https://${host}/alert-box/v3/${token}`,
      previewUrl: `https://${host}}/alert-box/v3/${token}`,
      dataFetchUrl: `https://${host}/api/v5/slobs/widget/alertbox?include_linked_integrations_only=true&primary_only=false`,
      settingsSaveUrl: `https://${host}/api/v5/slobs/widget/alertbox`,
      settingsUpdateEvent: 'filteredAlertBoxSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: false,
    },

    [WidgetType.ViewerCount]: {
      type: WidgetType.ViewerCount,

      defaultTransform: {
        width: 600,
        height: 200,
        x: 0,
        y: 1,
        anchor: AnchorPoint.SouthWest,
      },

      settingsWindowSize: {
        width: 600,
        height: 900,
      },

      url: `https://${host}/widgets/viewer-count?token=${token}`,
      previewUrl: `https://${host}/widgets/viewer-count?token=${token}&simulate=1`,
      dataFetchUrl: `https://${host}/api/v5/slobs/widget/viewercount`,
      settingsSaveUrl: `https://${host}/api/v5/slobs/widget/viewercount`,
      settingsUpdateEvent: 'viewerCountSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: true,
    },

    [WidgetType.GameWidget]: {
      type: WidgetType.GameWidget,

      defaultTransform: {
        width: 400,
        height: 450,
        x: 0.5,
        y: 0,
        anchor: AnchorPoint.North,
      },

      settingsWindowSize: {
        width: 850,
        height: 700,
      },

      url: `https://${host}/widgets/game-widget?token=${token}`,
      previewUrl: `https://${host}/widgets/game-widget?token=${token}&simulate=1`,
      dataFetchUrl: `https://${host}/api/v5/slobs/widget/game-widget`,
      settingsSaveUrl: `https://${host}/api/v5/slobs/widget/game-widget`,
      settingsUpdateEvent: 'gameWidgetSettingsUpdate',
      customCodeAllowed: false,
      customFieldsAllowed: false,
    },

    [WidgetType.EmoteWall]: {
      type: WidgetType.EmoteWall,

      defaultTransform: {
        width: 1280,
        height: 720,
        x: 0,
        y: 0,
        anchor: AnchorPoint.NorthWest,
      },

      settingsWindowSize: {
        width: 600,
        height: 900,
      },

      url: `https://${host}/widgets/emote-wall?token=${token}`,
      previewUrl: `https://${host}/widgets/emote-wall?token=${token}&simulate=1`,
      dataFetchUrl: `https://${host}/api/v5/slobs/widget/emote-wall`,
      settingsSaveUrl: `https://${host}/api/v5/slobs/widget/emote-wall`,
      settingsUpdateEvent: 'emoteWallSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: true,
    },

    // TODO:
    // BitGoal: {
    //
    // },

    // DonationGoal: {
    //
    // },

    // CharityGoal: {
    //
    // },

    // FollowerGoal: {
    //
    // },

    // StarsGoal: {
    //
    // },

    // SubGoal: {
    //
    // },

    // SubscriberGoal: {
    //
    // },

    // ChatBox: {
    //
    // },

    // ChatHighlight: {
    //
    // },

    // Credits: {
    //
    // },

    // DonationTicker: {
    //
    //  },

    // EventList: {
    //
    // },

    // MediaShare: {
    //
    //  },

    // Poll: {
    //
    //  },

    // SpinWheel: {
    //
    // },

    // SponsorBanner: {
    //
    // },

    // StreamBoss: {
    //
    //  },

    // TipJar: {
    //
    // },
  };
}
