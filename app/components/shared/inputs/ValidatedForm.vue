<template>
<form
  :data-vv-scope="validationScopeId"
  @submit.prevent="$emit('submit')"
  :name="name"
>
  <slot></slot>
  <span class="api-error">{{apiErrors}}</span>
</form>
</template>

<script lang="ts" src="./ValidatedForm.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.api-error {
  margin-top: 6px;
  min-height: 16px;
  font-size: 11px;
  color: @red;
}
</style>