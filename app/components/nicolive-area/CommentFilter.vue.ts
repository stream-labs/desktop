import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { NicoliveCommentFilterService } from 'services/nicolive-program/nicolive-comment-filter';
import { FilterType, FilterRecord } from 'services/nicolive-program/ResponseTypes';
import { UserService } from 'services/user';
import Banner from '../shared/banner.vue';
import Popper from 'vue-popperjs';
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

type FilterByUser = 'all' | 'broadcaster' | 'moderator';

@Component({
  components: {
    Banner,
    Popper,
  },
})
export default class CommentFilter extends Vue {
  @Inject()
  private nicoliveCommentFilterService: NicoliveCommentFilterService;

  @Inject()
  private userService: UserService;

  // @ts-expect-error: ts2729: use before initialization
  userId: string = this.userService.platform.id;

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

  currentFilterBy: FilterByUser = 'all';

  newFilterValue: string = '';

  get isEmptyBecauseOfFilterBy(): boolean {
    return this.currentTypeFilters.length === 0 && this.currentFilterBy !== 'all';
  }

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
    return 500;
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
    const isBroadcaster = (x: FilterRecord) => !x.userId || x.userId.toString() === this.userId;
    const filtersBy: (x: FilterRecord) => boolean = {
      all: () => true,
      broadcaster: isBroadcaster,
      moderator: (x: FilterRecord) => !isBroadcaster(x),
    }[this.currentFilterBy];

    return this.filters
      .filter(x => x.type === this.currentType)
      .filter(x => filtersBy(x))
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

  // TODO add 絞り込みフィルター(すべて/放送者モデレーター)
}
