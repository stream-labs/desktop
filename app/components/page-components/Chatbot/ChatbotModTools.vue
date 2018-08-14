<template>
<div class="padding--10">
  <div class="mod-chat-banner">
    <i class="icon-information" />
    <span>
      Don't forget to mod streamlabs chatbot by typing <span class="mod-chat-banner__code-highlight">/mod streamlabs</span> in your chat.
    </span>
  </div>
  <div class="align-items--inline">
    <ChatbotModule
      v-for="module in modules"
      :key="module.title"
      :chatbotModule="module"
    />
  </div>
</div>
</template>

<script lang='ts' src="./ChatbotModTools.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";
.mod-chat-banner {
  margin: 10px;
  display: flex;
  .radius();
  padding: 10px;
  text-align: center;
  background-color: @yellow-light-opac;
  border: @yellow;

  .icon-information {
    .margin-right();
    padding-top: 2px;
  }

  .mod-chat-banner__code-highlight {
    padding: 4px 7px;
    margin: 0 5px;
    .radius();
    .weight--bold();
    background-color: @yellow-med-opac;
  }
}

.night-theme {
  .mod-chat-banner {
    color: white;
  }
}
</style>
