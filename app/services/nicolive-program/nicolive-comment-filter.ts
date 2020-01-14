import { StatefulService, mutation } from 'services/stateful-service';
import { NicoliveClient } from './NicoliveClient';
import { Inject } from 'util/injector';
import { NicoliveProgramService } from './nicolive-program';
import { map, distinctUntilChanged } from 'rxjs/operators';

export type FilterRecord = {
  id: number;
  type: 'word' | 'user_id' | 'command';
  body: string;
};

export type FilterType = FilterRecord['type'];

interface INicoliveCommentFilterState {
  filters: FilterRecord[];
}

// TODO: replace with public api(after api's release)
class CommentFilterClient {
  private token: string = '';
  private lastProgramID: string = '';

  private async ensureToken(programID: string) {
    if (this.lastProgramID == programID && this.token) return;
    const resp = await fetch(`${NicoliveClient.live2BaseURL}/watch/${programID}`, {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-type': 'text/html',
      },
    });
    const text = await resp.text();
    const parsed = new DOMParser().parseFromString(text, 'text/html');
    const embedded = parsed.querySelector<HTMLElement>('#embedded-data');
    const props = JSON.parse(embedded.dataset.props);
    const token = props.site.relive.csrfToken;
    this.token = token;
    this.lastProgramID = programID;
  }

  private buildEndpoint(programID: string): string {
    return `${NicoliveClient.live2BaseURL}/unama/api/v3/programs/${programID}/comment_filters`;
  }

  private createRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', requestInit?: RequestInit): RequestInit {
    return {
      method,
      mode: 'cors',
      credentials: 'include',
      ...(requestInit || {}),
      headers: {
        'X-Public-Api-Token': this.token,
        'Content-Type': 'application/json',
        ...((requestInit && requestInit.headers) || {}),
      },
    };
  }

  async get(programID: string) {
    await this.ensureToken(programID);
    const resp = await fetch(this.buildEndpoint(programID), this.createRequest('GET'));
    return resp.json();
  }

  async post(programID: string, { type, body }: Omit<FilterRecord, 'id'>) {
    await this.ensureToken(programID);
    const resp = await fetch(
      this.buildEndpoint(programID),
      this.createRequest('POST', {
        body: JSON.stringify({
          type,
          body,
          _method: 'POST',
        }),
      })
    );
    return resp.json();
  }

  async delete(programID: string, { type, body }: FilterRecord) {
    await this.ensureToken(programID);
    const resp = await fetch(
      this.buildEndpoint(programID),
      this.createRequest('POST', {
        body: JSON.stringify({
          type,
          body,
          _method: 'DELETE',
        }),
      })
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
    const filters = result.data.filters.map((record: any, id: number) => ({ ...record, id }));
    this.UPDATE_FILTERS(filters);
  }

  async addFilter(record: Omit<FilterRecord, 'id'>) {
    const result = await this.client.post(this.programID, record);
    if (result && result.meta && result.meta.status === 200) {
      const resultRecord = { ...record, id: this.state.filters.length };
      const filters = this.state.filters.concat(resultRecord);
      this.UPDATE_FILTERS(filters);
    }
  }

  async deleteFilters(ids: number[]) {
    const records = ids.map(id => this.state.filters[id]);
    return Promise.all(records.map(async record => {
      const result = await this.client.delete(this.programID, record);
      return result && result.meta && result.meta.status === 200;
    }));
  }

  @mutation()
  private UPDATE_FILTERS(filters: FilterRecord[]) {
    this.state = { filters };
  }
}
