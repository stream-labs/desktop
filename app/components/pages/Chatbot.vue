<template>
  <div>
    <div class="chatbot__side-menu">
      <div class="flex flex--space-between chatbot__side-menu__global-toggle">
        <span>
          {{ globallyEnabled ? $t('Cloudbot Enabled') : $t('Cloudbot Disabled') }}
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
          class="padding--10 text-transform chatbot__side-menu__tab"
        >
          <div>{{ tab.title }}</div>
          <label class="chatbot__side-menu__tab__description" v-if="!tab.enabled" for="coming soon">Coming Soon</label>

          <NavMenu v-if="tab.children && tab.children.length" slot="children">
            <NavItem
              v-for="child in tab.children"
              :key="child.title"
              :to="child.title"
            >
              <div>{{ child.title }}</div>
            </NavItem>
          </NavMenu>

        </NavItem>
      </NavMenu>
    </div>
    <div v-if="authenticated" class="small-10 overflow--auto chatbot__content">
      <ChatbotBanner />
      <transition name="fade" mode="out-in" appear>
        <ChatbotModules v-if="selectedTab === 'Modules'"/>
        <ChatbotCustomCommands v-if="selectedTab === 'Custom Commands'"/>
        <ChatbotDefaultCommands v-if="selectedTab === 'Default Commands'"/>
        <ChatbotCommandVariables v-if="selectedTab === 'Variables'"/>
        <ChatbotTimers v-if="selectedTab === 'Timers'"/>
        <ChatbotModTools v-if="selectedTab === 'Mod Tools'"/>
        <ChatbotQuotes v-if="selectedTab === 'Quotes'"/>
        <ChatbotQueue v-if="selectedTab === 'Queue'"/>
        <ChatbotLoyalty v-if="selectedTab === 'Loyalty'"/>
        <ChatbotPoll v-if="selectedTab === 'Poll'" />
        <ChatbotBetting v-if="selectedTab === 'Betting'" />
      </transition>
    </div>
  </div>
</template>

<script lang='ts' src="./Chatbot.vue.ts"></script>

<style lang='less' scoped>
@import '../../styles/index';

.chatbot__content {
  width: calc(~'100% - 200px');
}
.chatbot__side-menu {
  width: 200px;
  background: @day-secondary;
  border-right: 1px solid @day-border;

  .chatbot__side-menu__global-toggle {
    padding: 20px;
    background-color: #eaf9f5;
    .weight(@bold);
  }
  .side-menu {
    margin-top: 0;
    padding-right: 5px !important;
  }

  .chatbot__side-menu__tab {
    padding: 5px 0 5px 40px;

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
