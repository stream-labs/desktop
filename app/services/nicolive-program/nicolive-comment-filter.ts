import { StatefulService, mutation } from 'services/stateful-service';
import { NicoliveClient, isOk } from './NicoliveClient';
import { FilterRecord } from './ResponseTypes';
import { Inject } from 'util/injector';
import { NicoliveProgramService } from './nicolive-program';
import { map, distinctUntilChanged } from 'rxjs/operators';

interface INicoliveCommentFilterState {
  filters: FilterRecord[];
}

export class NicoliveCommentFilterService extends StatefulService<INicoliveCommentFilterState> {
  @Inject() private nicoliveProgramService: NicoliveProgramService;
  private client = new NicoliveClient()
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
    const result = await this.client.fetchFilters(this.programID);
    if (isOk(result)) {
      this.UPDATE_FILTERS(result.value);
    }
  }

  async addFilter(record: Omit<FilterRecord, 'id'>) {
    const result = await this.client.addFilters(this.programID, [record]);
    if (isOk(result)) {
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
  }

  async deleteFilters(ids: number[]) {
    const result = await this.client.deleteFilters(this.programID, ids);
    if (isOk(result)) {
      const filters = this.state.filters.filter(rec => !ids.includes(rec.id));
      this.UPDATE_FILTERS(filters);
    }
  }

  @mutation()
  private UPDATE_FILTERS(filters: FilterRecord[]) {
    this.state = { filters };
  }
}
