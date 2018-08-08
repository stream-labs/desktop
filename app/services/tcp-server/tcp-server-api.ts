import { ISettingsSubCategory } from '../settings';


export interface ITcpServersSettings {
  token: string;
  namedPipe: {
    enabled: boolean;
    pipeName: string;
  };
}

export interface ITcpServerServiceApi {
  getApiSettingsFormData(): ISettingsSubCategory[];
  setSettings(settings: Partial<ITcpServersSettings>): void;
  getSettings(): ITcpServersSettings;
  getDefaultSettings(): ITcpServersSettings;
  listen(): void;
  stopListening(): void;
  getIPAddresses(): IIPAddressDescription[];
  state: ITcpServersSettings;
}

export interface IIPAddressDescription {
  address: string;
  interface: string;
  family: 'IPv4' | 'IPv6';
  internal: boolean;
}
