import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ChatbotPagination from 'components/page-components/Chatbot/shared/ChatbotPagination.vue';
import moment from 'moment';
import { Debounce } from 'lodash-decorators';

@Component({
  components: {
    ChatbotPagination
  }
})
export default class ChatbotQueueList extends ChatbotBase {
  @Prop()
  type: string;
  searchQuery = '';

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

  get currentPage() {
    return this.dataList.pagination.current;
  }

  get totalPages() {
    return this.dataList.pagination.total;
  }

  mounted() {
    this.fetchList(1);
  }

  fetchList(page = this.currentPage, query = this.searchQuery) {
    this.isPicked ?
      this.chatbotApiService.Queue.fetchQueuePicked(page) :
      this.chatbotApiService.Queue.fetchQueueEntries(page, query);
  }

  @Watch('searchQuery')
  @Debounce(1000)
  onQueryChangeHandler(value: string) {
    this.chatbotApiService.Queue.fetchQueueEntries(this.currentPage, value);
  }

  onClearListHandler() {
    this.isPicked ?
      this.chatbotApiService.Queue.clearQueuePicked() :
      this.chatbotApiService.Queue.clearQueueEntries();
  }

  formatDate(dateString: string) {
    return moment(dateString).format('LLL');
  }

  onPickEntryHandler(id: number) {
    this.chatbotApiService.Queue.pickQueueEntry(id);
  }

  onRemoveEntryHandler(id: number) {
    this.chatbotApiService.Queue.removeQueueEntry(id);
  }
}
