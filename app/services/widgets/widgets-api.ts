import { TPlatform } from '../platforms';
import { AnchorPoint } from 'util/ScalableRectangle';
import { WidgetType } from './widgets-data';

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
  url: (host: string, platform: TPlatform) => string;

  // Which platforms this tester can be used on
  platforms: TPlatform[];
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
