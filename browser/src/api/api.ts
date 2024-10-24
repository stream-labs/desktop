import { TAppServiceInstancess } from '../../../app/app-services.ts';
import { ApiClient, createApiClient } from './ApiClient.ts';

const url = 'http://127.0.0.1:59650/api';
const token = 'f9ebd973b12ab4228bb5cc856dd936aa1b644ded';




declare global {
  interface Window {
    __apiClient?: ApiClient;
  }
}

let client: ApiClient;

if (import.meta.hot) {
  if (!window.__apiClient) {
    client = new ApiClient(url, token);
    window.__apiClient = client;
  } else {
    client = window.__apiClient;
  }

  import.meta.hot.dispose(() => {
    client.disconnect();
  });
} else {
  client = new ApiClient(url, token);
}

export const api = createApiClient<TAppServiceInstancess>(client);