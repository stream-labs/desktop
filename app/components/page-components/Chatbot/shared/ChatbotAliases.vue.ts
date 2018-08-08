import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import TextInput from 'components/shared/inputs/TextInput.vue';

import {
  ITextMetadata,
} from 'components/shared/inputs/index';

@Component({
  components: {
    TextInput
  }
})
export default class ChatbotTimers extends Vue {
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
    newAliasArray.push(this.newAlias);
    this.$emit('input', newAliasArray);
    this.newAlias = null;
  }

  onDeleteAlias(aliasToDelete: string) {
    let newAliasArray = this.value.slice(0);
    newAliasArray = newAliasArray.filter(alias => alias !== aliasToDelete);
    this.$emit('input', newAliasArray);
  }
}
