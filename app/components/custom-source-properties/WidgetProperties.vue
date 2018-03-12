<template>
<div>
  <div class="input-container">
    <div class="input-label">
      Configure
    </div>
    <div class="input-wrapper">
      <button class="button button--default" @click="navigateDashboard">Go To Widget Settings</button>
    </div>
  </div>

  <ListInput :value="widgetModel" @input="handleInput" />
</div>
</template>

<script lang="ts" src="./WidgetProperties.vue.ts"></script>
