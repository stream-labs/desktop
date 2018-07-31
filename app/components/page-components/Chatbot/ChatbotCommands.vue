<template>
<div>
  <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTab">
    <div slot='custom'>
      <ChatbotCustomCommands />
    </div>
    <div slot="default">
      <ChatbotDefaultCommands />
    </div>
    <div slot="variables">
      <ChatbotCommandVariables />
    </div>
  </Tabs>
</div>
</template>

<script lang='ts' src="./ChatbotCommands.vue.ts"></script>
