<template>
<div class="align-items--inline">
  <ChatbotModule
    v-for="module in modules"
    :key="module.title"
    :chatbotModule="module"
  />
</div>
</template>

<script lang='ts' src="./ChatbotModules.vue.ts"></script>
