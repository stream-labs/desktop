import { StatefulService, mutation } from 'services/stateful-service';
import { NicoliveClient, isOk } from './NicoliveClient';
import { FilterRecord } from './ResponseTypes';
import { Inject } from 'util/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { NicoliveFailure } from './NicoliveFailure';

interface INicoliveCommentFilterState {
  filters: FilterRecord[];
};

export class NicoliveCommentFilterService extends StatefulService<INicoliveCommentFilterState> {
  @Inject() private nicoliveProgramService: NicoliveProgramService;
  private client = new NicoliveClient();

  static initialState = {
    filters: [] as FilterRecord[],
  };

  private get programID() {
    return this.nicoliveProgramService.state.programID;
  }

  get filters() {
    return this.state.filters;
  }

  init() {
    super.init();

    this.nicoliveProgramService.stateChange.pipe(
      map(({ programID }) => programID),
      distinctUntilChanged()
    ).subscribe(() => {
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
    const result = await this.client.fetchFilters(this.programID);
    if (!isOk(result)) {
      throw NicoliveFailure.fromClientError('fetchFilters', result);
    }

    this.UPDATE_FILTERS(result.value);
  }

  async addFilter(record: Omit<FilterRecord, 'id'>) {
    const result = await this.client.addFilters(this.programID, [record]);
    if (!isOk(result)) {
      throw NicoliveFailure.fromClientError('addFilters', result);
    }

    const resultRecord = result.value.find(
      (rec: FilterRecord) => rec.type === record.type && rec.body === record.body
    );

    if (!resultRecord) {
      // conflictしているので再取得しないとIDがわからない
      return this.fetchFilters();
    }
    const filters = this.state.filters.concat(resultRecord);
    this.UPDATE_FILTERS(filters);
  }

  async deleteFilters(ids: number[]) {
    const result = await this.client.deleteFilters(this.programID, ids);
    if (!isOk(result)) {
      throw NicoliveFailure.fromClientError('deleteFilters', result);
    }

    const filters = this.state.filters.filter(rec => !ids.includes(rec.id));
    this.UPDATE_FILTERS(filters);
  }

  @mutation()
  private UPDATE_FILTERS(filters: FilterRecord[]) {
    this.state = { filters };
  }
}
