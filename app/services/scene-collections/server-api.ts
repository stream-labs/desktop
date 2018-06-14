import { Service } from 'services/service';
import { Inject } from 'util/injector';
import { HostsService } from 'services/hosts';
import { handleErrors, authorizedHeaders } from 'util/requests';
import { UserService } from 'services/user';
import Util from 'services/utils';

export interface IServerSceneCollection {
  id?: number;
  name: string;
  data?: string;
  last_updated_at: string;
}

export interface ISceneCollectionsResponse {
  data: IServerSceneCollection[];
}

/**
 * This service manages interaction with the scene collections
 * server API.
 */
export class SceneCollectionsServerApiService extends Service {
  @Inject() hostsService: HostsService;
  @Inject() userService: UserService;

  /**
   * Fetch a list of all scene collections (doesn't include JSON)
   */
  fetchSceneCollections(): Promise<ISceneCollectionsResponse> {
    const url = `${this.baseUrl}/scene-collection`;
    const request = new Request(url, { headers: this.headers });

    return fetch(request)
      .then(handleErrors)
      .then(res => res.json());
  }

  /**
   * Fetch a single scene collection (includes JSON)
   */
  fetchSceneCollection(id: number): Promise<{ scene_collection: IServerSceneCollection }> {
    const url = `${this.baseUrl}/scene-collection/${id}`;
    const request = new Request(url, { headers: this.headers });

    return fetch(request)
      .then(handleErrors)
      .then(res => res.json());
  }

  fetchActiveCollection() {
    const url = `${this.baseUrl}/active/scene-collection`;
    const request = new Request(url, { headers: this.headers });

    return fetch(request)
      .then(handleErrors)
      .then(res => res.json());
  }

  makeSceneCollectionActive(id: number) {
    const url = `${this.baseUrl}/active/scene-collection/${id}`;
    const request = new Request(url, { headers: this.headers, method: 'POST' });

    return fetch(request)
      .then(handleErrors)
      .then(res => res.json());
  }

  createSceneCollection(collection: IServerSceneCollection): Promise<IServerSceneCollection> {
    const url = `${this.baseUrl}/scene-collection`;
    const headers = this.headers;
    headers.append('Content-Type', 'application/x-www-form-urlencoded');

    const body = this.formSerializeCollection(collection);
    const request = new Request(url, { headers, method: 'POST', body });

    return fetch(request)
      .then(handleErrors)
      .then(res => res.json());
  }

  updateSceneCollection(collection: IServerSceneCollection) {
    const url = `${this.baseUrl}/scene-collection/${collection.id}`;
    const headers = this.headers;
    headers.append('Content-Type', 'application/x-www-form-urlencoded');

    const body = this.formSerializeCollection(collection);
    const request = new Request(url, { headers, method: 'PUT', body });

    return fetch(request)
      .then(handleErrors)
      .then(res => res.json());
  }

  deleteSceneCollection(id: number) {
    const url = `${this.baseUrl}/scene-collection/${id}`;
    const request = new Request(url, { headers: this.headers, method: 'DELETE' });

    return fetch(request)
      .then(handleErrors)
      .then(res => res.json());
  }

  private formSerializeCollection(collection: IServerSceneCollection) {
    const bodyVars: string[] = [];
    bodyVars.push(`name=${encodeURIComponent(collection.name)}`);
    bodyVars.push(`data=${encodeURIComponent(collection.data)}`);
    bodyVars.push(`last_updated_at=${encodeURIComponent(collection.last_updated_at)}`);
    return bodyVars.join('&');
  }

  private get headers() {
    return authorizedHeaders(this.userService.apiToken);
  }

  private get baseUrl() {
    return `https://${this.hostsService.overlays}/api`;
  }
}
