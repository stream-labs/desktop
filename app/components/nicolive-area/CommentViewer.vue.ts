import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveCommentViewerService } from 'services/nicolive-program/nicolive-comment-viewer';
import CommentForm from './CommentForm.vue';
import CommentFilter from './CommentFilter.vue';
import CommentLocalFilter from './CommentLocalFilter.vue';
import { NicoliveCommentLocalFilterService } from 'services/nicolive-program/nicolive-comment-local-filter';

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

  isFilterOpened = false;

  isLocalFilterOpened = false;

  get items() {
    return this.nicoliveCommentViewerService.items.filter(this.nicoliveCommentLocalFilterService.filter);
  }
}
