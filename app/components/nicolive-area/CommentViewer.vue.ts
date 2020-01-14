import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveCommentViewerService } from 'services/nicolive-program/nicolive-comment-viewer';
import CommentForm from './CommentForm.vue';
import CommentFilter from './CommentFilter.vue';
import CommentLocalFilter from './CommentLocalFilter.vue';
import { NicoliveCommentLocalFilterService } from 'services/nicolive-program/nicolive-comment-local-filter';
import { ChatMessage } from 'services/nicolive-program/MessageServerClient';
import { Menu } from 'util/menus/Menu';
import { clipboard } from 'electron';
import { NicoliveCommentFilterService } from 'services/nicolive-program/nicolive-comment-filter';

@Component({
  components: {
    CommentForm,
    CommentFilter,
    CommentLocalFilter,
  }
})
export default class CommentViewer extends Vue {
  @Inject()
  private nicoliveCommentViewerService: NicoliveCommentViewerService;

  @Inject()
  private nicoliveCommentLocalFilterService: NicoliveCommentLocalFilterService;

  @Inject()
  private nicoliveCommentFilterService: NicoliveCommentFilterService;

  isFilterOpened = false;

  isLocalFilterOpened = false;
  pinnedComment: ChatMessage = null;

  get items() {
    return this.nicoliveCommentViewerService.items.filter(this.nicoliveCommentLocalFilterService.filter);
  }

  showCommentMenu(item: ChatMessage) {
    const menu = new Menu();
    menu.append({
      id: 'Copy comment',
      label: 'コメントをコピー',
      click: () => {
        clipboard.writeText(item.chat.content);
      },
    });
    menu.append({
      id: 'Copy id of comment owner',
      label: 'ユーザーIDをコピー',
      click: () => {
        clipboard.writeText(item.chat.user_id);
      },
    });
    menu.append({
      id: 'Add ',
      label: 'コメントをNGに追加',
      click: () => {
        this.nicoliveCommentFilterService.addFilter({ type: 'word', body: item.chat.content });
      },
    });
    menu.append({
      id: 'Copy id of comment owner',
      label: 'ユーザーIDをNGに追加',
      click: () => {
        this.nicoliveCommentFilterService.addFilter({ type: 'user_id', body: item.chat.user_id });
      },
    });
    menu.popup();
  }
}
