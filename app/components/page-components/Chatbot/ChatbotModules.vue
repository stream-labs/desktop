<template>
<div>
  <ChatbotModule
    v-for="(module, index) in modules"
    :key="index"
    :chatbotModule="module"
  />
</div>
</template>

<script lang='ts' src="./ChatbotModules.vue.ts"></script>
