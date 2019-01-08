import { Component, Prop, Watch } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';

import { ITextMetadata } from 'components/shared/inputs/index';
import { debounce } from 'lodash-decorators';

@Component({})
export default class ChatbotAliases extends ChatbotBase {
  @Prop()
  value: string[];

  newAlias: string = '';

  textInputMetadata: ITextMetadata = {
    placeholder: '!example',
  };

  get isDuplicate() {
    // remove "!" and check the rest
    const existingWithoutPrefix = this.value.map(alias => alias.replace('!', ''));
    const newWithoutPrefix = this.newAlias.replace('!', '');
    return (
      existingWithoutPrefix.length > 0 &&
      newWithoutPrefix &&
      existingWithoutPrefix.indexOf(newWithoutPrefix) > -1
    );
  }

  @Watch('newAlias', { immediate: true, deep: true })
  @debounce(1)
  onCommandChanged(value: string, oldValue: string) {
    if (oldValue) {
      this.newAlias = value.replace(/ +/g, '');
    }
  }

  onAddAliasHandler() {
    if (!this.newAlias) return;
    if (this.isDuplicate) return;

    const newAliasArray = this.value.slice(0);
    newAliasArray.push(this.formatAlias(this.newAlias));
    this.$emit('input', newAliasArray);
    this.newAlias = '';
  }

  formatAlias(value: string) {
    if (!value.startsWith('!')) {
      return `'!${value.replace(/\s/g, '')}`;
    }
    return value.replace(/\s/g, '');
  }

  onDeleteAliasHandler(aliasToDelete: string) {
    let newAliasArray = this.value.slice(0);
    newAliasArray = newAliasArray.filter(alias => alias !== aliasToDelete);
    this.$emit('input', newAliasArray);
  }
}
