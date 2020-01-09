import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveCommentViewerService } from 'services/nicolive-program/nicolive-comment-viewer';
import CommentForm from './CommentForm.vue';

@Component({
  components: {
    CommentForm
  }
})
export default class CommentViewer extends Vue {
  @Inject()
  private nicoliveCommentViewerService: NicoliveCommentViewerService;

  get items() {
    return this.nicoliveCommentViewerService.items;
  }
}
