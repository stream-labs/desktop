import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ChatbotPagination from 'components/page-components/Chatbot/shared/ChatbotPagination.vue';
import moment from 'moment';
import { Debounce } from 'lodash-decorators';
import { DELETE_MODAL, DELETE_ALL_MODAL, IQueuedUser } from 'services/chatbot';
import ChatbotGenericModalWindow from '../windows/ChatbotGenericModalWindow.vue';

@Component({
  components: {
    ChatbotPagination,
    ChatbotGenericModalWindow,
  },
})
export default class ChatbotQueueList extends ChatbotBase {
  @Prop() type: string;

  searchQuery = '';
  selectedUser: IQueuedUser = null;

  get DELETE_MODAL() {
    return `${DELETE_MODAL}-${this.type}`;
  }

  get DELETE_ALL_MODAL() {
    return `${DELETE_ALL_MODAL}-${this.type}`;
  }

  get entryList() {
    return this.chatbotApiService.Queue.state.queueEntriesResponse;
  }

  get pickedList() {
    return this.chatbotApiService.Queue.state.queuePickedResponse;
  }

  get dataList() {
    return this.isPicked ? this.pickedList : this.entryList;
  }

  get isPicked() {
    return this.type === 'picked';
  }

  get currentAfter() {
    return this.dataList.cursor.after;
  }

  mounted() {
    this.fetchList(0);
  }

  scrollDown() {
    const scrollHeight = document
      .getElementsByClassName('queue__table-wrapper')[0]
      .getBoundingClientRect().height;
    const scrollTop = document.getElementsByClassName('queue__table-wrapper')[0].scrollTop;
    const clientHeight = document.getElementsByClassName('queue-table')[0].clientHeight;

    const bottomOfWindow = scrollHeight + scrollTop >= clientHeight - 100;

    if (bottomOfWindow) {
      this.fetchList();
    }
  }

  fetchList(after = this.currentAfter, query = this.searchQuery) {
    this.isPicked
      ? this.chatbotApiService.Queue.fetchQueuePicked(after)
      : this.chatbotApiService.Queue.fetchQueueEntries(after, query);
  }

  @Watch('searchQuery')
  @Debounce(1000)
  onQueryChangeHandler(value: string) {
    this.chatbotApiService.Queue.fetchQueueEntries(0, value);
  }

  @Debounce(1000)
  loadNewEntries() {
    if (this.dataList.data.length < 25) {
      this.chatbotApiService.Queue.fetchQueueEntries(this.currentAfter, this.searchQuery);
    }
  }

  onClearListHandler() {
    this.$modal.show(this.DELETE_ALL_MODAL);
  }

  formatDate(dateString: string) {
    return moment(dateString).format('LTS');
  }

  onPickEntryHandler(id: number) {
    if (this.pickedList.data.length < 18) {
      this.chatbotApiService.Queue.pickQueueEntry(id).then(() => {
        this.loadNewEntries();
      });
    }
  }

  onRemoveEntryHandler(user: IQueuedUser) {
    this.selectedUser = user;
    this.$modal.show(this.DELETE_MODAL);
  }

  onYesSingleHandler() {
    if (this.selectedUser) {
      this.chatbotApiService.Queue.removeQueueEntry(this.selectedUser.id).then(() => {
        this.loadNewEntries();
      });
    }
  }

  onNoSingleHandler() {
    this.selectedUser = null;
  }

  onYesAllHandler() {
    this.isPicked
      ? this.chatbotApiService.Queue.clearQueuePicked()
      : this.chatbotApiService.Queue.clearQueueEntries();
  }

  onNoAllHandler() {
    //  Empty return just so the button shows
    return;
  }
}
