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

@Component({
  components: {
    CommentForm,
    CommentFilter,
    CommentLocalFilter,
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
  filterTooltip = 'NG設定';
  localFilterTooltip = 'フィルター';

  isFilterOpened = false;

  isLocalFilterOpened = false;
  pinnedComment: WrappedChat = null;
  isLatestVisible = true;

  pin(item: WrappedChat): void {
    this.pinnedComment = item;
  }

  get items() {
    return this.nicoliveCommentViewerService.items.filter(this.applyLocalFilter);
  }

  private applyLocalFilter = ({ value }: WrappedChat) => this.nicoliveCommentLocalFilterService.filter(value);

  format = NicoliveProgramService.format;

  itemToString(item: WrappedChat) {
    const { vpos, content } = item.value;
    const { vposBaseTime, startTime } = this.nicoliveProgramService.state;
    const vposTime = vposBaseTime + Math.floor(vpos / 100);
    const diffTime = vposTime - startTime;
    return `${content} (${this.format(diffTime)})`;
  }

  showCommentMenu(item: WrappedChat) {
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
    menu.popup();
  }

  mounted() {
    const sentinelEl = this.$refs.sentinel as Element;
    const ioCallback: IntersectionObserverCallback = (entries) => {
      this.isLatestVisible = entries[0].isIntersecting;
    };
    const ioOptions = {
      rootMargin: '0px',
      threshold: [0.75, 1],
    };
    const io = new IntersectionObserver(ioCallback, ioOptions);
    io.observe(sentinelEl);
  }
}
