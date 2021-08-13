import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { NicoliveCommentLocalFilterService } from 'services/nicolive-program/nicolive-comment-local-filter';

@Component({})
export default class CommentLocalFilter extends Vue {
  @Inject()
  private nicoliveCommentLocalFilterService: NicoliveCommentLocalFilterService;

  close() {
    this.$emit('close');
  }

  get showAnonymous() {
    return this.nicoliveCommentLocalFilterService.showAnonymous;
  }

  set showAnonymous(v: boolean) {
    this.nicoliveCommentLocalFilterService.showAnonymous = v;
  }
}
