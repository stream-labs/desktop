import { StatefulService, mutation } from 'services/stateful-service';
import { NicoliveClient } from './NicoliveClient';
import { Inject } from 'util/injector';
import { NicoliveProgramService } from './nicolive-program';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { remote } from 'electron';

export type FilterRecord = {
  id: number;
  type: 'word' | 'user_id' | 'command';
  body: string;
};

export type FilterType = FilterRecord['type'];

interface INicoliveCommentFilterState {
  filters: FilterRecord[];
}

class CommentFilterClient {

  private buildEndpoint(programID: string): string {
    return `${NicoliveClient.live2BaseURL}/unama/tool/v2/programs/${programID}/ssng`;
  }

  private async createRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    requestInit?: RequestInit
  ): Promise<RequestInit> {
    const session = await this.getSession();
    return {
      method,
      mode: 'cors',
      credentials: 'include',
      ...(requestInit || {}),
      headers: {
        'X-Niconico-Session': session,
        'Content-Type': 'application/json',
        ...((requestInit && requestInit.headers) || {}),
      },
    };
  }

  private async getSession(): Promise<string> {
    const { session } = remote.getCurrentWebContents();
    return new Promise((resolve, reject) =>
      session.cookies.get({ url: 'https://.nicovideo.jp', name: 'user_session' }, (err, cookies) => {
        if (err) return reject(err);
        resolve(cookies[0].value);
      })
    );
  }

  async get(programID: string) {
    const requestInit = await this.createRequest('GET');
    const resp = await fetch(this.buildEndpoint(programID), requestInit);
    return resp.json();
  }

  async post(programID: string, records: Omit<FilterRecord, 'id'>[]) {
    const requestInit = await this.createRequest('POST', {
      body: JSON.stringify(records)
    });
    const resp = await fetch(
      this.buildEndpoint(programID),
      requestInit
    );
    return resp.json();
  }

  async delete(programID: string, ids: FilterRecord['id'][]) {
    const requestInit = await this.createRequest('DELETE', {
      body: JSON.stringify({
        id: ids,
      })
    });
    const resp = await fetch(
      this.buildEndpoint(programID),
      requestInit
    );
    return resp.json();
  }
}

export class NicoliveCommentFilterService extends StatefulService<INicoliveCommentFilterState> {
  @Inject() private nicoliveProgramService: NicoliveProgramService;
  private client = new CommentFilterClient()
  private get programID() {
    return this.nicoliveProgramService.state.programID;
  }

  get filters() {
    return this.state.filters;
  }

  init() {
    this.nicoliveProgramService.stateChange.pipe(
      map(({ programID }) => programID),
      distinctUntilChanged()
    ).subscribe(() => {
      this.clear();
    });
  }

  clear() {
    this.UPDATE_FILTERS([]);
  }

  async fetchFilters() {
    const result = await this.client.get(this.programID);
    this.UPDATE_FILTERS(result.data);
  }

  async addFilter(record: Omit<FilterRecord, 'id'>) {
    const result = await this.client.post(this.programID, [record]);
    if (result && result.meta && result.meta.status === 200) {
      const resultRecord = result.data.find(
        (rec: FilterRecord) => rec.type === record.type && rec.body === record.body
      );
      const filters = this.state.filters.concat(resultRecord);
      this.UPDATE_FILTERS(filters);
    }
  }

  async deleteFilters(ids: number[]) {
    const result = await this.client.delete(this.programID, ids);
    return result && result.meta && result.meta.status === 200;
  }

  @mutation()
  private UPDATE_FILTERS(filters: FilterRecord[]) {
    this.state = { filters };
  }
}
