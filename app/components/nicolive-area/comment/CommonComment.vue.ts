import { Component, Prop } from 'vue-property-decorator';
import { CommentBase } from './CommentBase';

@Component({})
export default class CommonComment extends CommentBase {
  @Prop({ default: false }) commentMenuOpened: boolean;
  @Prop() speaking: boolean;
}
