import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({})
export default class ChatbotPagination extends Vue {
  @Prop() totalPages: number;
  @Prop() currentPage: number;

  onEmitPageChangeHandler(page: number) {
    this.$emit('change', page);
  }

  onPrevPageHandler(){
    this.$emit('change', this.currentPage - 1);
  }

  onNextPageHandler(){
    this.$emit('change', this.currentPage + 1);
  }

  onFirstPageHandler(){
    this.$emit('change', 1);
  }

  onLastPageHandler(){
    this.$emit('change', this.totalPages);
  }

  get customTotalPages(){
    let startIndex = Math.max(1,this.currentPage - 5);
    const endIndex = Math.min(startIndex+10,this.totalPages);

    const endOffset = endIndex - startIndex;
    if(endOffset < 10){
      startIndex = Math.max(1,startIndex-(10 - endOffset))
    }

    let arr = [];
    for(let i= startIndex;i <= endIndex;++i){
      arr.push(i);
    }

    return arr;
  }
}