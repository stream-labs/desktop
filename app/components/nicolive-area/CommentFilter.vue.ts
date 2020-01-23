import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveCommentFilterService } from 'services/nicolive-program/nicolive-comment-filter';
import { FilterType } from 'services/nicolive-program/ResponseTypes';

@Component({})
export default class CommentFilter extends Vue {
  @Inject()
  private nicoliveCommentFilterService: NicoliveCommentFilterService;

  checkedSet: Set<number> = new Set();
  checkCount = 0;

  hasChecked(id: number): boolean {
    return this.checkedSet.has(id);
  }
  updateChecked(id: number, checked: boolean) {
    if (checked) {
      this.checkedSet.add(id);
    } else {
      this.checkedSet.delete(id);
    }
    this.checkCount = this.checkedSet.size;
  }

  async reloadFilters() {
    this.clearChecked();
    return this.nicoliveCommentFilterService.fetchFilters();
  }

  clearChecked() {
    this.checkedSet.clear();
    this.checkCount = 0;
  }

  async deleteFilters() {
    try {
      await this.nicoliveCommentFilterService.deleteFilters([...this.checkedSet]);
      return this.reloadFilters();
    } catch (e) {
      console.error(e);
    }
  }

  currentType: FilterType = 'word';
  newFilterValue: string = '';

  get count() {
    return this.filters.length;
  }

  onAdd() {
    const body = this.newFilterValue;
    this.nicoliveCommentFilterService.addFilter({
      type: this.currentType,
      body,
    }).then(() => {
      this.newFilterValue = '';
    }, e => console.error(e));
  }

  close() {
    this.$emit('close');
  }

  get filters() {
    return this.nicoliveCommentFilterService.filters;
  }

  get currentTypeFilters() {
    return this.filters.filter(x => x.type === this.currentType);
  }

  mounted() {
    this.reloadFilters();
  }
}
