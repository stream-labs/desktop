<template>
<div>
  <div class="input-container">
    <div class="input-label">
      {{ $t('Configure') }}
    </div>
    <div class="input-wrapper">
      <button class="button button--default" @click="navigateDashboard">
        {{ $t('Go To Widget Settings') }}
      </button>
    </div>
  </div>

  <ObsListInput :value="widgetModel" @input="handleInput" />
</div>
</template>

<script lang="ts" src="./WidgetProperties.vue.ts"></script>
