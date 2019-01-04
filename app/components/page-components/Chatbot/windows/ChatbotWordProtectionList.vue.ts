import { Component, Prop } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';

import {
  EInputType,
  IInputMetadata,
  IListMetadata,
  INumberMetadata,
  ITextMetadata,
} from '../../../shared/inputs';

import { IWordProtectionBlackListItem, NEW_WORD_PROTECTION_LIST_MODAL_ID } from 'services/chatbot';

import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

@Component({
  components: { ValidatedForm },
})
export default class ChatbotLinkProtectionList extends ChatbotBase {
  $refs: {
    form: ValidatedForm;
  };

  @Prop()
  value: IWordProtectionBlackListItem[];

  newListItem: IWordProtectionBlackListItem = {
    text: null,
    is_regex: false,
    punishment: {
      duration: 10,
      type: 'Purge',
    },
  };
  editIndex: number = -1;

  get metadata() {
    return {
      text: {
        required: true,
        type: EInputType.text,
        placeholder: 'Add a link to add to list',
      },
      punishment: {
        duration: {
          type: EInputType.number,
          required: true,
          placeholder: 'Punishment Duration (Value in Seconds)',
          min: 0,
        },
        type: {
          required: true,
          type: EInputType.list,
          options: this.chatbotPunishments,
        },
      },
      is_regex: {
        required: true,
        type: EInputType.bool,
        title: 'This word / phrase contains a regular expression.',
      },
    };
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

  onAddingNewItemHandler(editedItem?: IWordProtectionBlackListItem, index: number = -1) {
    if (editedItem) {
      this.newListItem = editedItem;
    }
    this.editIndex = index;
    this.$modal.show(NEW_WORD_PROTECTION_LIST_MODAL_ID);
  }

  onDeleteAliasHandler(index: number) {
    const newListItemArray = this.value.slice(0);
    newListItemArray.splice(index, 1);
    this.$emit('input', newListItemArray);
  }

  async onAddNewItemHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    const newListItemArray = this.value.slice(0);

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
        type: 'Purge',
      },
    };
    this.editIndex = -1;
    this.onCancelNewItemModalHandler();
  }

  onCancelNewItemModalHandler() {
    this.$modal.hide(NEW_WORD_PROTECTION_LIST_MODAL_ID);
  }
}
