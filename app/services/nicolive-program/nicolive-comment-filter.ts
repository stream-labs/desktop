import { StatefulService, mutation } from 'services/core/stateful-service';
import { NicoliveClient, isOk } from './NicoliveClient';
import { FilterRecord } from './ResponseTypes';
import { Inject } from 'services/core/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { NicoliveFailure } from './NicoliveFailure';
import { WrappedChat } from './WrappedChat';
import { Subject } from 'rxjs';

interface INicoliveCommentFilterState {
  filters: FilterRecord[];
}

export class NicoliveCommentFilterService extends StatefulService<INicoliveCommentFilterState> {
  @Inject() private nicoliveProgramService: NicoliveProgramService;
  private client = new NicoliveClient();

  static initialState = {
    filters: [] as FilterRecord[],
  };

  private stateChangeSubject = new Subject<INicoliveCommentFilterState>();
  stateChange = this.stateChangeSubject.asObservable();

  applyFilter<T extends WrappedChat>(wrapped: T) {
    if (wrapped.type === 'normal') {
      for (const record of this.state.filters) {
        if (
          (record.type === 'word' && wrapped.value.content?.includes(record.body)) ||
          (record.type === 'user' && wrapped.value.user_id === record.body) ||
          (record.type === 'command' && wrapped.value.mail?.split(/\s/).includes(record.body))
        ) {
          return { ...wrapped, filtered: true };
        }
      }
    }
    if (wrapped.filtered) return { ...wrapped, filtered: false };
    return wrapped;
  }

  private get programID() {
    return this.nicoliveProgramService.state.programID;
  }

  get filters() {
    return this.state.filters;
  }

  init() {
    super.init();

    this.nicoliveProgramService.stateChange
      .pipe(
        map(({ programID }) => programID),
        distinctUntilChanged(),
      )
      .subscribe(() => {
        this.fetchFilters().catch(caught => {
          if (caught instanceof NicoliveFailure) {
            // ignore
          } else {
            throw caught;
          }
        });
      });
  }

  async fetchFilters() {
    // DEBUG
    if (process.env.DEV_SERVER) {
      // yarn dev 時は省略
      return;
    }
    const result = await this.client.fetchFilters(this.programID);
    if (!isOk(result)) {
      throw NicoliveFailure.fromClientError('fetchFilters', result);
    }

    this.updateFilters(result.value);
  }

  async addFilter(record: Omit<FilterRecord, 'id'>) {
    const result = await this.client.addFilters(this.programID, [record]);
    if (!isOk(result)) {
      throw NicoliveFailure.fromClientError('addFilters', result);
    }

    const resultRecord = result.value.find(
      (rec: FilterRecord) => rec.type === record.type && rec.body === record.body,
    );

    if (!resultRecord) {
      // conflictしているので再取得しないとIDがわからない
      return this.fetchFilters();
    }
    const filters = this.state.filters.concat(resultRecord);
    this.updateFilters(filters);
  }

  async deleteFilters(ids: number[]) {
    const result = await this.client.deleteFilters(this.programID, ids);
    if (!isOk(result)) {
      throw NicoliveFailure.fromClientError('deleteFilters', result);
    }

    const filters = this.state.filters.filter(rec => !ids.includes(rec.id));
    this.updateFilters(filters);
  }

  private updateFilters(filters: FilterRecord[]) {
    this.UPDATE_FILTERS(filters);
    this.stateChangeSubject.next({ filters });
  }

  @mutation()
  private UPDATE_FILTERS(filters: FilterRecord[]) {
    this.state = { filters };
  }
}
