<template>
  <div>
    <div class="chatbot__side-menu">
      <div class="flex flex--space-between chatbot__side-menu__global-toggle">
        <span class="text-transform--uppercase">
          {{ $t(`Chatbot ${globallyEnabled ? 'enabled' : 'disabled'}`) }}
        </span>
        <ToggleInput
          :value="globallyEnabled"
          @input="onToggleEnableChatbotHandler"
        />
      </div>
      <NavMenu v-model="selectedTab" class="side-menu">
        <NavItem
          v-for="tab in tabNames"
          :key="tab.title"
          :to="tab.title"
          :ico="icons[tab.title]"
          :enabled="tab.enabled"
          class="padding--10 text-transform--capitalize chatbot__side-menu__tab"
        >
          <div>{{ $t(tab.title) }}</div>
          <label class="chatbot__side-menu__tab__description" v-if="!tab.enabled" for="coming soon">Coming Soon</label>
        </NavItem>
      </NavMenu>
    </div>
    <div v-if="authenticated" class="small-10 overflow--auto chatbot__content">
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


.chatbot__content {
  width: calc(~"100% - 250px");
}
.chatbot__side-menu {
  width: 250px;
  background: @day-secondary;
  border-right: 1px solid @day-border;

  .chatbot__side-menu__global-toggle {
    padding: 20px;
    background-color: #EAF9F5;
    .weight--bold();
  }
  .side-menu {
    margin-top: 0;
  }

  .chatbot__side-menu__tab {
    padding: 5px 65px;

    .chatbot__side-menu__tab__description {
      font-size: 12px;
      line-height: 13px;
    }
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
