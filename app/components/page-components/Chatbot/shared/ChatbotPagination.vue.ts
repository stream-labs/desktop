import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({})
export default class ChatbotPagination extends Vue {
  @Prop() totalPages: number;
  @Prop() currentPage: number;

  onEmitPageChangeHandler(page: number) {
    this.$emit('change', page);
  }

  onPrevPageHandler() {
    this.$emit('change', this.currentPage - 1);
  }

  onNextPageHandler() {
    this.$emit('change', this.currentPage + 1);
  }

  onFirstPageHandler() {
    this.$emit('change', 1);
  }

  onLastPageHandler() {
    this.$emit('change', this.totalPages);
  }

  get customTotalPages() {
    let startIndex = Math.max(2, this.currentPage - 4);
    const endIndex = Math.min(startIndex + 8, this.totalPages - 1);

    const endOffset = endIndex - startIndex;
    if (endOffset < 8 && this.totalPages > 8) {
      startIndex = Math.max(1, startIndex - (8 - endOffset));
    }

    const arr = [];
    for (let i = startIndex; i <= endIndex; ++i) {
      arr.push(i);
    }

    return arr;
  }
}
