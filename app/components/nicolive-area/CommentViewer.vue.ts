import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveCommentViewerService, WrappedChat } from 'services/nicolive-program/nicolive-comment-viewer';
import CommentForm from './CommentForm.vue';
import CommentFilter from './CommentFilter.vue';
import CommentLocalFilter from './CommentLocalFilter.vue';
import { NicoliveCommentLocalFilterService } from 'services/nicolive-program/nicolive-comment-local-filter';
import { ChatMessage } from 'services/nicolive-program/MessageServerClient';
import { Menu } from 'util/menus/Menu';
import { clipboard } from 'electron';
import { NicoliveCommentFilterService } from 'services/nicolive-program/nicolive-comment-filter';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
import { ChatMessageType } from 'services/nicolive-program/ChatMessage/classifier';
import CommonComment from './comment/CommonComment.vue';
import SystemMessage from './comment/SystemMessage.vue';
import GiftComment from './comment/GiftComment.vue';
import NicoadComment from './comment/NicoadComment.vue';

const componentMap: { [type in ChatMessageType]: Vue.Component } = {
  normal: CommonComment,
  operator: CommonComment,
  nicoad: NicoadComment,
  gift: GiftComment,
  spi: SystemMessage,
  quote: SystemMessage,
  cruise: SystemMessage,
  info: SystemMessage,
  unknown: SystemMessage,
  'n-air-emulated': SystemMessage,
};

@Component({
  components: {
    CommentForm,
    CommentFilter,
    CommentLocalFilter,
    CommonComment,
    NicoadComment,
    GiftComment,
    SystemMessage,
  }
})
export default class CommentViewer extends Vue {
  @Inject()
  private nicoliveProgramService: NicoliveProgramService;

  @Inject()
  private nicoliveCommentViewerService: NicoliveCommentViewerService;

  @Inject()
  private nicoliveCommentLocalFilterService: NicoliveCommentLocalFilterService;

  @Inject()
  private nicoliveCommentFilterService: NicoliveCommentFilterService;

  // TODO: 後で言語ファイルに移動する
  commentReloadTooltip = 'コメント再取得';
  filterTooltip = 'NG設定';
  localFilterTooltip = 'フィルター設定';

  isFilterOpened = false;

  isLocalFilterOpened = false;
  pinnedComment: WrappedChat = null;
  isLatestVisible = true;

  private applyLocalFilter = ({ value }: WrappedChat) => this.nicoliveCommentLocalFilterService.filter(value);

  scrollToLatest() {
    const scrollEl = this.$refs.scroll as HTMLElement;
    scrollEl.scrollTop = scrollEl.scrollHeight;
  }

  pin(item: WrappedChat): void {
    if (item.type === 'normal') {
      this.pinnedComment = item;
    }
  }

  pinnedItemComtent(item: WrappedChat): string {
    return `${item.value.content}  (${this.vposToLiveTime(item.value.vpos)})`;
  }

  componentMap = componentMap;

  get items() {
    return this.nicoliveCommentViewerService.items;
  }

  refreshConnection() {
    this.nicoliveCommentViewerService.refreshConnection();
  }
  vposToLiveTime = (vpos: number = 0): string => {
    const { vposBaseTime, startTime } = this.nicoliveProgramService.state;
    const vposTime = vposBaseTime + Math.floor(vpos / 100);
    const diffTime = vposTime - startTime;
    return NicoliveProgramService.format(diffTime);
  }

  commentMenuTarget: WrappedChat | null = null;
  showCommentMenu(item: WrappedChat) {
    if (!(item.type === 'normal' || item.type === 'operator')) {
      return;
    }

    const menu = new Menu();
    menu.append({
      id: 'Copy comment',
      label: 'コメントをコピー',
      click: () => {
        clipboard.writeText(item.value.content);
      },
    });
    menu.append({
      id: 'Copy id of comment owner',
      label: 'ユーザーIDをコピー',
      click: () => {
        clipboard.writeText(item.value.user_id);
      },
    });

    if (item.type === 'normal') {
      menu.append({
        id: 'Pin this comment',
        label: 'コメントをピン留め',
        click: () => {
          this.pin(item);
        },
      });
      menu.append({
        type: 'separator',
      });
      menu.append({
        id: 'Add ',
        label: 'コメントをNGに追加',
        click: () => {
          this.nicoliveCommentFilterService.addFilter({ type: 'word', body: item.value.content });
        },
      });
      menu.append({
        id: 'Copy id of comment owner',
        label: 'ユーザーIDをNGに追加',
        click: () => {
          this.nicoliveCommentFilterService.addFilter({ type: 'user_id', body: item.value.user_id });
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
    const ioCallback: IntersectionObserverCallback = (entries) => {
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
      const popouts = this.nicoliveCommentViewerService.recentPopouts.filter(this.applyLocalFilter);
      const opt = {
        top: -popouts.length * 32 /* item's height */
      };
      scrollEl.scrollBy(opt);
    }
  }
}
