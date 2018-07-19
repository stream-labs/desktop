<template>
<div>
  <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTab">
    <div slot='custom'>
      Custom Commands Tab
    </div>
    <div slot="default">
      <ChatbotDefaultCommands />
    </div>
    <div slot="variables">
      Variables
    </div>
  </Tabs>
</div>
</template>

<script lang='ts' src="./ChatbotCommands.vue.ts"></script>
