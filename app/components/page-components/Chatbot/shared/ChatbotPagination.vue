
<template>
  <div class="chatbot-pagination__container">
    <div
      v-for="i in totalPages"
      :class="{'chatbot-pagination__page--current': i === currentPage}"
      @click="onEmitPageChangeHandler(i)"
      class="chatbot-pagination__page"
      :key="i"
    >
      {{ i }}
    </div>
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


.night-theme {
.chatbot-pagination__page {
    &.chatbot-pagination__page--current {
      color: @white;
    }
  }
}
</style>
