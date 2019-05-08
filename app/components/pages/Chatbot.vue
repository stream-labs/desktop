<template>
  <webview class="chatbot" v-show="loggedIn" id="chatbotWebview" :src="chatbotUrl" ref="chatbot"></webview>
</template>

<script lang='ts' src="./Chatbot.vue.ts"></script>

