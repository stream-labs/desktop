<template>
<div v-if="modBannerVisible" class="callout callout--info">
  <div>
    <i class="icon-information" />
    <span>
      Don't forget to mod streamlabs chatbot by typing <span class="mod-chat-banner__code-highlight">/mod streamlabs</span> in your chat.
    </span>
  </div>
  <i class="callout__close icon-close cursor--pointer" @click="onCloseBannerHandler"></i>
</div>
</template>

<script lang='ts' src="./ChatbotBanner.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";

.mod-chat-banner__code-highlight {
  padding: 4px @spacing;
  margin: 0 4px;
  .radius();
  .weight(@medium);
  background-color: @yellow-med-opac;
  user-select: all;
}

</style>
````