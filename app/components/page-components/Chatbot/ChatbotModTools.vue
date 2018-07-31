<template>
<div>
  <ChatbotModule
    v-for="(module, index) in modules"
    :key="index"
    :chatbotModule="module"
  />
</div>
</template>

<script lang='ts' src="./ChatbotModTools.vue.ts"></script>
