<template>
  <div v-if="modBannerVisible" class="mod-chat-banner flex flex--space-between">
    <div v-if="isYoutube">
      <i class="icon-information"/>
      Don't forget to mod Streamlabs by going to your
      <span
        class="redirect-link"
        @click="openCommunitySettings()"
      >Youtube Community Settings</span>
      and adding
      <span
        style="text-transform:none;margin:0px 8px;"
        class="label label--left label--beta"
      >https://www.youtube.com/channel/UCNL8jaJ9hId96P13QmQXNtA</span>
      as a moderator.
    </div>
    <div v-else>
      <i class="icon-information"/>
      <span>
        Don't forget to mod Streamlabs by typing
        <span
          class="mod-chat-banner__code-highlight"
        >/mod streamlabs</span> in your chat.
      </span>
    </div>
    <i class="icon-close cursor--pointer" @click="onCloseBannerHandler"></i>
  </div>
</template>

<script lang='ts' src="./ChatbotBanner.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.mod-chat-banner {
  .margin();
  display: flex;
  .radius();
  .padding();
  text-align: center;
  background-color: var(--info-semi);
  color: var(--info-dark);

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
    background-color: var(--yellow-semi);
    color: var(--white);
    user-select: all;
  }

  .label--beta {
    background-color: var(--info-dark);
    .radius();
    font-weight: 500;
  }

  .redirect-link {
    text-decoration: underline;
    .cursor--pointer;
    font-weight:500;
  }
}
</style>
