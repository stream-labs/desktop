<template>
<div class="height--100">
  <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTab">
    <div slot='custom'>
      <transition name="fade" mode="out-in" appear>
        <ChatbotCustomCommands />
      </transition>
    </div>
    <div slot="default">
      <transition name="fade" mode="out-in">
        <ChatbotDefaultCommands />
      </transition>
    </div>
    <div slot="variables">
      <transition name="fade" mode="out-in">
        <ChatbotCommandVariables />
      </transition>
    </div>
  </Tabs>
</div>
</template>

<script lang='ts' src="./ChatbotCommands.vue.ts"></script>
