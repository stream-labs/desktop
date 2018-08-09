import { Component, Prop } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';

import {
  ITextMetadata,
} from 'components/shared/inputs/index';

@Component({})
export default class ChatbotAliases extends ChatbotBase {
  @Prop() value: string[];

  newAlias: string = null;

  textInputMetadata: ITextMetadata = {
    placeholder: '!example'
  };

  get isDuplicate() {
    return this.value.length > 0 && this.newAlias && this.value.indexOf(this.newAlias) > -1;
  }

  onAddAlias() {
    if (!this.newAlias) return;
    if (this.isDuplicate) return;

    let newAliasArray = this.value.slice(0);
    newAliasArray.push(this.formatAlias(this.newAlias));
    this.$emit('input', newAliasArray);
    this.newAlias = null;
  }

  formatAlias(value: string) {
    if (!value.startsWith('!')) {
      return '!' + value.replace(/\s/g, '');
    }
    return value.replace(/\s/g, '');
  }

  onDeleteAlias(aliasToDelete: string) {
    let newAliasArray = this.value.slice(0);
    newAliasArray = newAliasArray.filter(alias => alias !== aliasToDelete);
    this.$emit('input', newAliasArray);
  }
}
