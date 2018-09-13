<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Enabling Song Request')"
>
  <div slot="content">
    <div>
      Welcome stuff!
    </div>
  </div>
  <div slot="controls">
    <button
      class="button button--default"
      @click="onCancelHandler">
      {{ $t('Cancel') }}
    </button>
    <button
      class="button button--action"
      @click="onSaveHandler"
    >
      {{ $t('Proceed') }}
    </button>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotSongRequestOnboardingWindow.vue.ts"></script>

