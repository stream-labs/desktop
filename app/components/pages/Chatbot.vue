<template>
  <div>
    <div class="small-2 chatbot__side-menu">
      <div class="flex flex--space-between chatbot__side-menu__global-toggle">
        <span>
          {{ $t(`Chatbot ${globallyEnabled ? 'enabled' : 'disabled'}`) }}
        </span>
        <ToggleInput
          :value="globallyEnabled"
          @input="toggleEnableChatbot"
        />
      </div>
      <NavMenu v-model="selectedTab" class="side-menu">
        <NavItem
          v-for="tab in tabNames"
          :key="tab"
          :to="tab"
          :ico="icons[tab]"
          class="padding--10 chatbot__side-menu__tab"
        >
          {{ $t(tab) }}
        </NavItem>
      </NavMenu>
    </div>
    <div v-if="authenticated" class="small-10 overflow--auto">
      <transition name="fade" mode="out-in" appear>
        <ChatbotModules v-if="selectedTab === 'Modules'"/>
        <ChatbotCommands v-if="selectedTab === 'Commands'"/>
        <ChatbotTimers v-if="selectedTab === 'Timers'"/>
        <ChatbotModTools v-if="selectedTab === 'Mod Tools'"/>
      </transition>
    </div>
  </div>
</template>

<script lang='ts' src="./Chatbot.vue.ts"></script>

<style lang='less' scoped>
@import "../../styles/index";

.chatbot__side-menu {
  background: @day-secondary;
  border-right: 1px solid @day-border;

  .chatbot__side-menu__global-toggle {
    padding: 20px 36px;
    background-color: #EAF9F5;
    .weight(@bold);
  }
  .side-menu {
    margin-top: 0;
  }

  .chatbot__side-menu__tab {
    padding: 10px 80px;
  }
}

.night-theme {
  .chatbot__side-menu {
    border-color: @night-secondary;
    background-color: @night-secondary;

    .chatbot__side-menu__global-toggle {
      background-color: #173134;
    }
  }
}
</style>
