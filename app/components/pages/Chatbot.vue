<template>
  <div>
    <div class="small-2 padding--10 chatbot__side-menu">
      <NavMenu v-model="selectedTab" class="side-menu">
        <NavItem
          v-for="tab in tabNames"
          :key="tab"
          :to="tab"
          :ico="icons[tab]"
          class="padding--10"
        >
          {{ $t(tab) }}
        </NavItem>
      </NavMenu>
    </div>
    <div v-if="!authenticated">
      <h1>Connecting to Chatbot...</h1>
    </div>
    <div v-else  class="small-10">
      <ChatbotModules v-if="selectedTab === 'Modules'"/>
      <ChatbotCommands v-if="selectedTab === 'Commands'"/>
      <ChatbotTimers v-if="selectedTab === 'Timers'"/>
      <ChatbotModTools v-if="selectedTab === 'Mod Tools'"/>
    </div>
  </div>
</template>

<script lang='ts' src="./Chatbot.vue.ts"></script>

<style lang='less' scoped>
@import "../../styles/index";

.chatbot__side-menu {
  background: @day-secondary;
  border-right: 1px solid @day-border;
}

.night-theme {
  .chatbot__side-menu {
    border-color: @night-secondary;
    background-color: @night-secondary;
  }
}
</style>
