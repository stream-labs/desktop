<template>
<div>
  <div class="input-container">
    <div class="input-label">
      {{ $t('Configure') }}
    </div>
    <div class="input-wrapper">
      <button v-if="isLoggedIn"  class="button button--default" @click="navigateDashboard">
        {{ $t('Go To Widget Settings') }}
      </button>
      <button v-else class="button button--default" @click="login">
        {{ $t('Please login to configure widget') }}
      </button>
    </div>
  </div>

  <ObsListInput :value="widgetModel" @input="handleInput" />
</div>
</template>

<script lang="ts" src="./WidgetProperties.vue.ts"></script>
