<template>
  <div class="step">
   <div class="section-header">
     <h3 class="section-title">{{ title }}</h3>
     <p class="section-description">{{ description }} </p>
   </div>
   <div class="section">
     <slot />
   </div>
  </div>
</template>

<script lang="ts" src="./Step.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/_colors";

.step {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.section-header {
  padding: 16px;
  border-bottom: 1px solid @bg-quinary;
}

.section {
  padding: 0;
  border: none;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
};

.section-title {
  font-size: 16px;
  margin-bottom: 8px;
  color: @white;
}

.section-description {
  font-size: 12px;
  margin: 0;
  color: @grey;
}

</style>
