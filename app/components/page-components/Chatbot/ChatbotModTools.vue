<template>
<div class="align-items--inline margin--10">
  <ChatbotModule
    v-for="module in modules"
    :key="module.title"
    :chatbotModule="module"
  />
</div>
</template>

<script lang='ts' src="./ChatbotModTools.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";
.mod-chat-banner {
  .margin();
  display: flex;
  .radius();
  .padding();
  text-align: center;
  background-color: @info-light;
  color: @info-dark;

  .icon-close {
    .padding--5;
    font-size: 10px;
  }

  .icon-information {
    .margin-right();
    padding-top: 2px;
  }

  .mod-chat-banner__code-highlight {
    padding: 4px @spacing;
    margin: 0 4px;
    .radius();
    .weight(@medium);
    background-color: @yellow-med-opac;
    user-select: all;
  }
}

</style>
