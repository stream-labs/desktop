import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveProgramService, NicoliveProgramServiceFailure } from 'services/nicolive-program/nicolive-program';

@Component({})
export default class CommentForm extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;

  isCommentSending: boolean = false;
  operatorCommentValue: string = '';

  async sendOperatorComment(event: KeyboardEvent) {
    const text = this.operatorCommentValue;
    const isPermanent = event.ctrlKey;
    if (this.isCommentSending) throw new Error('sendOperatorComment is running');

    try {
      this.isCommentSending = true;
      await this.nicoliveProgramService.sendOperatorComment(text, isPermanent);
      this.operatorCommentValue = '';
    } catch (caught) {
      
      if (caught instanceof NicoliveProgramServiceFailure) {
        await NicoliveProgramService.openErrorDialogFromFailure(caught);
      } else {
        throw caught;
      }
    } finally {
      this.isCommentSending = false;
    }
  }
}
