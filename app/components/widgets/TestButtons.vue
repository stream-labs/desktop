<template>
  <div>
    <button
      class="button button--action"
      v-for="tester in widgetTesters"
      :key="tester.name"
      @click="tester.test()">
      {{ $t(tester.name) }}
    </button>
  </div>
</template>

<script lang="ts" src="./TestButtons.vue.ts"></script>

<style lang="less" scoped>
  button {
    margin-right: 10px;
  }
</style>