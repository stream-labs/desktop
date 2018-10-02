<template>
<div v-if="modBannerVisible" class="mod-chat-banner flex flex--space-between">
  <div>
    <i class="icon-information" />
    <span>
      Don't forget to mod streamlabs chatbot by typing <span class="mod-chat-banner__code-highlight">/mod streamlabs</span> in your chat.
    </span>
  </div>
  <i class="icon-close cursor--pointer" @click="onCloseBannerHandler"></i>
</div>
</template>

<script lang='ts' src="./ChatbotBanner.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";
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
