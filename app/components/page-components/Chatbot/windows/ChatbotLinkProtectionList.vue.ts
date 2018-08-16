import { Component, Prop } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';

import { ITextMetadata } from 'components/shared/inputs/index';

import {
  NEW_LINK_PROTECTION_LIST_MODAL_ID
} from 'services/chatbot/chatbot-interfaces';

@Component({})
export default class ChatbotLinkProtectionList extends ChatbotBase {
  @Prop() value: string[];
  @Prop() title: string;

  newListItem: string = null;
  editIndex: number = -1;

  textInputMetadata: ITextMetadata = {
    required: true,
    placeholder: 'Add a link to add to list'
  };

  get NEW_LINK_PROTECTION_LIST_MODAL_ID() {
    return NEW_LINK_PROTECTION_LIST_MODAL_ID;
  }

  get isDuplicate() {
    return (
      this.value.length > 0 &&
      this.newListItem &&
      this.value.indexOf(this.newListItem) > -1
    );
  }

  onAddingNewItem(editedItem?: string, index: number = -1) {
    if (editedItem) {
      this.newListItem = editedItem;
    }
    this.editIndex = index;
    this.$modal.show(NEW_LINK_PROTECTION_LIST_MODAL_ID);
  }

  onDeleteAlias(index: number) {
    let newListItemArray = this.value.slice(0);
    newListItemArray.splice(index, 1);
    this.$emit('input', newListItemArray);
  }

  onAddNewItem() {
    if (!this.newListItem) return;

    let newListItemArray = this.value.slice(0);

    if (this.editIndex > -1) {
      // editing existing item
      newListItemArray.splice(this.editIndex, 1, this.newListItem);
    } else {
      newListItemArray.push(this.newListItem);
    }
    this.$emit('input', newListItemArray);
    this.newListItem = null;
    this.editIndex = -1;
    this.onCancelNewItemModal();
  }

  onCancelNewItemModal() {
    this.$modal.hide(NEW_LINK_PROTECTION_LIST_MODAL_ID);
  }
}
