import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveCommentFilterService } from 'services/nicolive-program/nicolive-comment-filter';
import { FilterType, FilterRecord } from 'services/nicolive-program/ResponseTypes';
import { UserService } from 'services/user';

@Component({})
export default class CommentFilter extends Vue {
  @Inject()
  private nicoliveCommentFilterService: NicoliveCommentFilterService;

  @Inject()
  private userService: UserService;

  async reloadFilters() {
    return this.nicoliveCommentFilterService.fetchFilters();
  }

  deleting: boolean = false;
  async deleteFilter(record: FilterRecord) {
    try {
      this.deleting = true;
      await this.nicoliveCommentFilterService.deleteFilters([ record.id ]);
    } catch (e) {
      console.error(e);
    } finally {
      this.deleting = false;
    }
  }

  currentType: FilterType = 'word';

  @Watch('currentType')
  onTypeChange() {
    this.newFilterValue = '';
  }

  newFilterValue: string = '';

  FILTER_VALUE = {
    word: 'コメント',
    user: 'ユーザーID',
    command: 'コマンド',
  };

  get count() {
    return this.filters.length;
  }

  get maxCount() {
    return this.userService.isPremium ? 500 : 40;
  }

  adding: boolean = false;
  async onAdd() {
    const body = this.newFilterValue;
    if (body.length === 0) return;

    try {
      this.adding = true;
      await this.nicoliveCommentFilterService.addFilter({
        type: this.currentType,
        body,
      });
      this.newFilterValue = '';
    } catch (e) {
      console.error(e);
    } finally {
      this.adding = false;

      this.$nextTick(() => {
        (this.$refs.input as HTMLElement)?.focus();
      });
    }
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
