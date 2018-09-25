<template>
<div>
  <div class="input-container">
    <div class="input-label">
      {{ $t('Configure') }}
    </div>
    <div class="input-wrapper">
      <button v-if="isLoggedIn"  class="button button--default" @click="navigateWidgetSettings">
        {{ $t('Go To Widget Settings') }}
      </button>
      <button v-else class="button button--default" @click="login">
        {{ $t('Please login to configure widget') }}
      </button>
    </div>
  </div>

</div>
</template>

<script lang="ts" src="./WidgetProperties.vue.ts"></script>
