import { Component, Prop } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue'

import {
  IInputMetadata,
  ITextMetadata,
  IListMetadata,
  INumberMetadata
} from 'components/shared/inputs/index';

import {
  IWordProtectionBlackListItem,
  NEW_WORD_PROTECTION_LIST_MODAL_ID
} from 'services/chatbot/chatbot-interfaces';

@Component({})
export default class ChatbotLinkProtectionList extends ChatbotBase {
  @Prop() value: IWordProtectionBlackListItem[];

  newListItem: IWordProtectionBlackListItem = {
    text: null,
    is_regex: false,
    punishment: {
      duration: 10,
      type: 'Purge'
    }
  };
  editIndex: number = -1;

  get metadata() {
    let metadata: {
      text: ITextMetadata;
      punishment: {
        duration: INumberMetadata;
        type: IListMetadata<string>;
      };
      is_regex: IInputMetadata
    } = {
      text: {
        required: true,
        placeholder: 'Add a link to add to list'
      },
      punishment: {
        duration: {
          required: true,
          placeholder: 'Punishment Duration (Value in Minutes)',
          min: 0
        },
        type: {
          required: true,
          options: this.chatbotPunishments
        }
      },
      is_regex: {
        required: true,
        title: 'This word / phrase contains a regular expression.'
      }
    };
    return metadata;
  }

  get NEW_WORD_PROTECTION_LIST_MODAL_ID() {
    return NEW_WORD_PROTECTION_LIST_MODAL_ID;
  }

  get isDuplicate() {
    return (
      this.value.length > 0 &&
      this.newListItem.text &&
      this.value.map(word => word.text).indexOf(this.newListItem.text) > -1
    );
  }

  onAddingNewItem(
    editedItem?: IWordProtectionBlackListItem,
    index: number = -1
  ) {
    if (editedItem) {
      this.newListItem = editedItem;
    }
    this.editIndex = index;
    this.$modal.show(NEW_WORD_PROTECTION_LIST_MODAL_ID);
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
    this.newListItem = {
      text: null,
      is_regex: false,
      punishment: {
        duration: 10,
        type: 'Purge'
      }
    };
    this.editIndex = -1;
    this.onCancelNewItemModal();
  }

  onCancelNewItemModal() {
    this.$modal.hide(NEW_WORD_PROTECTION_LIST_MODAL_ID);
  }
}
