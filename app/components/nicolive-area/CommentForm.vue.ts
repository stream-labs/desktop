import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';

@Component({})
export default class CommentForm extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;

  isCommentSending: boolean = false;
  operatorCommentValue: string = '';

  async sendOperatorComment(event: KeyboardEvent) {
    const text = this.operatorCommentValue;
    if (text.length === 0) return;
    const isPermanent = event.ctrlKey;
    if (this.isCommentSending) throw new Error('sendOperatorComment is running');

    try {
      this.isCommentSending = true;
      await this.nicoliveProgramService.sendOperatorComment(text, isPermanent);
      this.operatorCommentValue = '';
    } catch (err) {
      // TODO
      console.warn(err);
    } finally {
      this.isCommentSending = false;
    }
  }

  get programStatus(): string {
    return this.nicoliveProgramService.state.status;
  }
}
