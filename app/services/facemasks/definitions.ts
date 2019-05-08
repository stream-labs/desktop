export interface IFacemasksServiceState {
  modtimeMap: Dictionary<IFacemaskMetadata>;
  active: boolean;
  downloadProgress: number;
  settings: IFacemaskSettings;
}

export interface IFacemaskMetadata {
  modtime: number;
  intro: boolean;
}

export interface IInputDeviceSelection {
  name: string;
  value: string;
  selected?: boolean;
}

export interface IFacemask {
  modtime: number;
  uuid: string;
  is_intro: boolean;
  type: string;
  tier: number;
  name: string;
}

export interface IFacemaskSettings {
  enabled: boolean;
  donations_enabled: boolean;
  subs_enabled: boolean;
  extension_enabled: boolean;
  bits_enabled: boolean;
  bits_price: number;
  pricing_options: number[];
  primary_platform: string;
  t2masks: IFacemask[];
  t3masks: IFacemask[];
  facemasks: IFacemask[];
  duration: number;
  sub_duration: number;
  bits_duration: number;
  device: IInputDeviceSelection;
  username: string;
  twitch_id?: number;
  partnered: boolean;
  extension: boolean;
  extension_url: string;
}

export interface IUserFacemaskSettings {
  enabled: boolean;
  facemasks?: IFacemask[];
  duration: number;
  device: IInputDeviceSelection;
  donations_enabled: boolean;
  subs_enabled: boolean;
  sub_duration?: number;
  bits_enabled: boolean;
  bits_duration?: number;
  bits_price: number;
}

export interface IFacemaskDonation {
  eventId: string;
  facemask: string;
}

export interface IFacemaskBits {
  eventId: string;
  facemask: string;
}

export interface IFacemaskSubscription {
  name: string;
  subscriberId: string;
  subPlan: string;
}

export interface IFacemaskSelection {
  uuid: string;
}
