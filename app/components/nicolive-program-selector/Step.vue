<template>
  <div class="step">
   <div class="section">
     <h3>{{ title }}</h3>
     <p>{{ description }} </p>
   </div>
   <div class="section">
     <slot />
   </div>
  </div>
</template>

<script lang="ts" src="./Step.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/_colors";

.section:last-child {
  border-bottom: none;
}

</style>
