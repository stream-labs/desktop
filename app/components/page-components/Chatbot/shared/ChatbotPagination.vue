
<template>
  <div class="chatbot-pagination__container">
    <i @click="onFirstPageHandler" disabled="currentPage == 1" class="fa fa-angle-double-left chatbot-pagionation__icon"/>
    <i @click="onPrevPageHandler" disabled="currentPage == 1" class="fa fa-angle-left chatbot-pagionation__icon"/>
    <div
      v-for="i in customTotalPages"
      :class="{'chatbot-pagination__page--current': i === currentPage}"
      @click="onEmitPageChangeHandler(i)"
      class="chatbot-pagination__page"
      :key="i"
    >
      {{ i }}
    </div>
    <i @click="onNextPageHandler" disabled="currentPage == totalPages" class="fa fa-angle-right chatbot-pagionation__icon"/>
    <i @click="onLastPageHandler" :disabled="currentPage == totalPages" class="fa fa-angle-double-right chatbot-pagionation__icon"/>
  </div>
</template>

<script lang='ts' src="./ChatbotPagination.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";

.chatbot-pagination__container {
  .flex();
  .chatbot-pagination__page {
    .padding(1);
    cursor: pointer;

    &.chatbot-pagination__page--current {
      color: @day-title;
      .weight(@bold);
    }
  }
}

.chatbot-pagionation__icon {
  font-size: 20px;
  cursor: pointer;
  .padding(1);
  .padding-left();
  .padding-right();
}


.night-theme {
.chatbot-pagination__page {
    &.chatbot-pagination__page--current {
      color: @white;
    }
  }
}
</style>
