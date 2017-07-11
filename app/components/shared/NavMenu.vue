<template>
  <ul class="nav-menu">
    <slot></slot>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({})
export default class NavMenu extends Vue {

  @Prop()
  value: string;

  setValue(value: string) {
    this.$emit('input', value);
  }

}
</script>

<style lang="less" scoped>
@import "../../styles/index";

.nav-menu {
  margin: 0 0 -20px -20px;
  flex: 0 0 200px;
  border-right: 1px solid @day-border;
  display: flex;
  flex-direction: column;
  background: @day-secondary;
  margin-top: -20px;
  padding-top: 20px;
}

.night-theme {
  .nav-menu {
    border-color: @night-border;
    background-color: @night-primary;
  }
}
</style>
