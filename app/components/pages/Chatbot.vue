<template>
  <webview class="chatbot" v-show="loggedIn" partition="chatbot" id="chatbotWebview" :src="chatbotUrl" webpreferences="nativeWindowOpen=true" ref="chatbot" allowpopups></webview>
</template>

<script lang='ts' src="./Chatbot.vue.ts"></script>

