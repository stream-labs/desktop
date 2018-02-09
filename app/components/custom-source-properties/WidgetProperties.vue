<template>
<div>
  <button @click="navigateDashboard">Test</button>
  <ListInput :value="widgetModel" @input="handleInput" />
</div>
</template>

<script lang="ts" src="./WidgetProperties.vue.ts"></script>
