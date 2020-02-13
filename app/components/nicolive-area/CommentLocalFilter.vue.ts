import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import {
  NicoliveCommentLocalFilterService,
  NGSharingLevel
} from 'services/nicolive-program/nicolive-comment-local-filter';

@Component({})
export default class CommentLocalFilter extends Vue {
  @Inject()
  private nicoliveCommentLocalFilterService: NicoliveCommentLocalFilterService;

  NG_SHARING_LEVEL_LABELS = {
    none: 'OFF',
    low: '弱',
    mid: '中',
    high: '強',
  };

  close() {
    this.$emit('close');
  }

  get NG_SHARING_LEVELS() {
    return NicoliveCommentLocalFilterService.NG_SHARING_LEVELS;
  }

  get level() {
    return this.nicoliveCommentLocalFilterService.level;
  }

  set level(level: NGSharingLevel) {
    this.nicoliveCommentLocalFilterService.level = level;
  }

  get showAnonymous() {
    return this.nicoliveCommentLocalFilterService.showAnonymous;
  }

  set showAnonymous(v: boolean) {
    this.nicoliveCommentLocalFilterService.showAnonymous = v;
  }
}
