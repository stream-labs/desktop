<template>
  <div class="chatbot-container">
    <webview
      class="chatbot"
      v-show="loggedIn"
      id="chatbotWebview"
      :src="chatbotUrl"
      ref="chatbot">
    </webview>
  </div>
</template>

<script lang='ts' src="./Chatbot.vue.ts"></script>

