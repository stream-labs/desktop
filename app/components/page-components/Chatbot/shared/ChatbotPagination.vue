
<template>
  <div class="chatbot-pagination__container">
    <i @click="onPrevPageHandler" disabled="currentPage == 1" class="fa fa-angle-left chatbot-pagionation__icon"/>
    <div :class="{'chatbot-pagination__page--current': 1 === currentPage}"
      @click="onEmitPageChangeHandler(1)"
      class="chatbot-pagination__page">
      1
    </div>
    <div class="chatbot-pagination__dots" v-if="currentPage > 6">...</div>
    <div
      v-for="i in customTotalPages"
      :class="{'chatbot-pagination__page--current': i === currentPage}"
      @click="onEmitPageChangeHandler(i)"
      class="chatbot-pagination__page"
      :key="i"
    >
      {{ i }}
    </div>
    <div class="chatbot-pagination__dots" v-if="currentPage < totalPages - 5">...</div>
    <div :class="{'chatbot-pagination__page--current': totalPages === currentPage}"
      @click="onEmitPageChangeHandler(totalPages)"
      class="chatbot-pagination__page">
      {{ totalPages }}
    </div>
    <i @click="onNextPageHandler" disabled="currentPage == totalPages" class="fa fa-angle-right chatbot-pagionation__icon"/>
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
      color: var(--title);
      .weight(@bold);
    }
  }
  .chatbot-pagination__dots {
    .padding(1);
  }
}

.chatbot-pagionation__icon {
  font-size: 20px;
  cursor: pointer;
  .padding(1);
  .padding-left();
  .padding-right();
}
</style>
