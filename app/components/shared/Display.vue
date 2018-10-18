<template>
<div class="display" ref="display" @click="onClickHandler"></div>
</template>

<script lang="ts" src="./Display.vue.ts"></script>

<style lang="less" scoped>
.display {
  height: 100%;
  background-color: black;
  flex-grow: 1;
}
</style>
