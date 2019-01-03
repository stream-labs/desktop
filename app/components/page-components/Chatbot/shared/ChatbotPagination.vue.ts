import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({})
export default class ChatbotPagination extends Vue {
  @Prop() totalPages: number;
  @Prop() currentPage: number;

  onEmitPageChangeHandler(page: number) {
    this.$emit('change', page);
  }
}
