import { TAppServices } from '../../app/app-services.ts';

class StreamlabsDesktopWSAPIClient {

  services: TAppServices;
  async get(url: string): Promise<any> {
    const response = await fetch(url);
    return await response.json();
  }
}

export const api = new StreamlabsDesktopWSAPIClient();
