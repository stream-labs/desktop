import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { NicoliveCommentFilterService } from 'services/nicolive-program/nicolive-comment-filter';
import { FilterType, FilterRecord } from 'services/nicolive-program/ResponseTypes';
import { UserService } from 'services/user';
import Banner from '../shared/banner.vue';
import {
  NicoliveFailure,
  openErrorDialogFromFailure,
} from 'services/nicolive-program/NicoliveFailure';

function isHash(item: FilterRecord): boolean {
  if (item.type !== 'user') return false;
  return item.isHashed || false;
}

function getBody(item: FilterRecord): string {
  if (item.type === 'user') {
    return `ID: ${isHash(item) ? '******** (匿名)' : item.body}`;
  } else {
    return item.body;
  }
}

@Component({
  components: {
    Banner,
  },
})
export default class CommentFilter extends Vue {
  @Inject()
  private nicoliveCommentFilterService: NicoliveCommentFilterService;

  @Inject()
  private userService: UserService;

  async reloadFilters() {
    try {
      return this.nicoliveCommentFilterService.fetchFilters();
    } catch (caught) {
      if (caught instanceof NicoliveFailure) {
        await openErrorDialogFromFailure(caught);
      } else {
        throw caught;
      }
    }
  }

  deleting: boolean = false;
  async deleteFilter(record: FilterRecord) {
    try {
      this.deleting = true;
      await this.nicoliveCommentFilterService.deleteFilters([record.id]);
    } catch (caught) {
      if (caught instanceof NicoliveFailure) {
        await openErrorDialogFromFailure(caught);
      } else {
        throw caught;
      }
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
  PLACEHOLDER = {
    word: 'コメントを入力',
    user: 'ユーザーIDを入力 (例:12345678)',
    command: 'コマンドを入力',
  };

  get count() {
    return this.filters.length;
  }

  get maxCount() {
    return this.userService.isPremium ? 500 : 40;
  }

  get invalid(): boolean {
    if (this.newFilterValue === '') {
      return false;
    }
    if (this.currentType === 'user') {
      return !this.newFilterValue.match(/^[1-9][0-9]*$/);
    }
    return false;
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
    } catch (caught) {
      if (caught instanceof NicoliveFailure) {
        await openErrorDialogFromFailure(caught);
      } else {
        throw caught;
      }
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
    return this.filters
      .filter(x => x.type === this.currentType)
      .map(item => {
        return {
          id: item.id,
          type: item.type,
          body: getBody(item),
          register_date: `登録日時: ${new Date(item.createdAt).toLocaleString()}`,
          comment_body: item.memo && `コメント: ${item.memo}`,
        };
      });
  }

  mounted() {
    this.reloadFilters();
  }

  get isBannerOpened(): boolean {
    return !this.nicoliveCommentFilterService.ngPanelInfoCoachingClosed;
  }
  set isBannerOpened(value: boolean) {
    this.nicoliveCommentFilterService.ngPanelInfoCoachingClosed = !value;
  }
}
