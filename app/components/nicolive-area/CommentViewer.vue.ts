import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { NicoliveCommentViewerService } from 'services/nicolive-program/nicolive-comment-viewer';
import { WrappedChat, WrappedChatWithComponent } from 'services/nicolive-program/WrappedChat';
import CommentForm from './CommentForm.vue';
import CommentFilter from './CommentFilter.vue';
import CommentSettings from './CommentSettings.vue';
import { ChatMessage } from 'services/nicolive-program/ChatMessage';
import { Menu } from 'util/menus/Menu';
import { clipboard } from 'electron';
import { NicoliveCommentFilterService } from 'services/nicolive-program/nicolive-comment-filter';
import { getContentWithFilter } from 'services/nicolive-program/getContentWithFilter';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
import CommonComment from './comment/CommonComment.vue';
import SystemMessage from './comment/SystemMessage.vue';
import GiftComment from './comment/GiftComment.vue';
import NicoadComment from './comment/NicoadComment.vue';
import EmotionComment from './comment/EmotionComment.vue';
import { ChatComponentType } from 'services/nicolive-program/ChatMessage/ChatComponentType';

const componentMap: { [type in ChatComponentType]: Vue.Component } = {
  common: CommonComment,
  nicoad: NicoadComment,
  gift: GiftComment,
  emotion: EmotionComment,
  system: SystemMessage,
};

@Component({
  components: {
    CommentForm,
    CommentFilter,
    CommentSettings,
    CommonComment,
    NicoadComment,
    GiftComment,
    EmotionComment,
    SystemMessage,
  },
})
export default class CommentViewer extends Vue {
  @Inject()
  private nicoliveProgramService: NicoliveProgramService;

  @Inject()
  private nicoliveCommentViewerService: NicoliveCommentViewerService;

  @Inject()
  private nicoliveCommentFilterService: NicoliveCommentFilterService;

  // TODO: 後で言語ファイルに移動する
  commentReloadTooltip = 'コメント再取得';
  commentSynthesizerTooltip = 'コメント読み上げ';
  filterTooltip = 'NG設定';
  settingsTooltip = 'コメント設定';

  isFilterOpened = false;

  isSettingsOpened = false;
  isLatestVisible = true;

  get pinnedComment(): WrappedChat | null {
    return this.nicoliveCommentViewerService.state.pinnedMessage;
  }

  scrollToLatest() {
    const scrollEl = this.$refs.scroll as HTMLElement;
    scrollEl.scrollTop = scrollEl.scrollHeight;
  }

  pin(item: WrappedChatWithComponent | null): void {
    if (!item || item.type === 'normal') {
      this.nicoliveCommentViewerService.pinComment(item);
    }
  }

  pinnedItemComtent(item: WrappedChat): string {
    return `${getContentWithFilter(item)}  (${this.getFormattedLiveTime(item.value)})`;
  }

  componentMap = componentMap;

  get items() {
    return this.nicoliveCommentViewerService.itemsLocalFiltered;
  }

  get speakingEnabled(): boolean {
    return this.nicoliveCommentViewerService.speakingEnabled;
  }
  set speakingEnabled(e: boolean) {
    this.nicoliveCommentViewerService.speakingEnabled = e;
  }

  get speakingSeqId() {
    return this.nicoliveCommentViewerService.speakingSeqId;
  }

  refreshConnection() {
    this.nicoliveCommentViewerService.refreshConnection();
  }

  // getterにして関数を返さないと全コメントに対してrerenderが走る
  get getFormattedLiveTime() {
    return (chat: ChatMessage): string => {
      const { startTime } = this.nicoliveProgramService.state;
      const diffTime = (chat.date ?? 0) - startTime;
      return NicoliveProgramService.format(diffTime);
    };
  }

  commentMenuTarget: WrappedChatWithComponent | null = null;
  showCommentMenu(item: WrappedChatWithComponent) {
    if (!(item.type === 'normal' || item.type === 'operator')) {
      return;
    }

    const menu = new Menu();
    menu.append({
      id: 'Copy comment content',
      label: 'コメントをコピー',
      click: () => {
        clipboard.writeText(item.value.content);
      },
    });
    menu.append({
      id: "Copy comment owner's id",
      label: 'ユーザーIDをコピー',
      click: () => {
        clipboard.writeText(item.value.user_id);
      },
    });

    if (item.type === 'normal') {
      menu.append({
        id: 'Pin the comment',
        label: 'コメントをピン留め',
        click: () => {
          this.pin(item);
        },
      });
      menu.append({
        type: 'separator',
      });
      menu.append({
        id: 'Ban comment content',
        label: 'コメントをNGに追加',
        click: () => {
          this.nicoliveCommentFilterService.addFilter({ type: 'word', body: item.value.content });
        },
      });
      menu.append({
        id: 'Ban comment owner',
        label: 'ユーザーIDをNGに追加',
        click: () => {
          this.nicoliveCommentFilterService.addFilter({ type: 'user', body: item.value.user_id });
        },
      });
    }

    // コンテキストメニューが出るとホバー判定が消えるので、外観を維持するために注目している要素を保持しておく
    menu.menu.once('menu-will-show', () => {
      this.commentMenuTarget = item;
    });
    menu.menu.once('menu-will-close', () => {
      if (this.commentMenuTarget === item) {
        this.commentMenuTarget = null;
      }
    });
    menu.popup();
  }

  mounted() {
    const sentinelEl = this.$refs.sentinel as HTMLElement;
    const ioCallback: IntersectionObserverCallback = entries => {
      this.isLatestVisible = entries[0].isIntersecting;
    };
    const ioOptions = {
      rootMargin: '0px',
      threshold: 0,
    };
    const io = new IntersectionObserver(ioCallback, ioOptions);
    io.observe(sentinelEl);
  }

  updated() {
    const scrollEl = this.$refs.scroll as HTMLElement;
    if (this.isLatestVisible) {
      this.scrollToLatest();
    } else {
      const popouts = this.nicoliveCommentViewerService.recentPopoutsLocalFiltered;
      const opt = {
        top: -popouts.length * 32, // item's height
      };
      scrollEl.scrollBy(opt);
    }
  }
}
