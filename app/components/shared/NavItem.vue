<template>
<li
  class="nav-item"
  :class="{ active: to === value, disabled: enabled == false }"
  @click="onClickHandler"
>
  <i v-if="ico" :class="'fa fa-' + ico" @click="onIconClickHandler"></i>
  <slot></slot>
</li>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({})

export default class NavItem extends Vue {

  @Prop()
  to: string;

  @Prop()
  ico: string;

  @Prop({ default: true })
  enabled: boolean;

  navMenu = this.$parent as any as { value: string; setValue: (value: string) => void };

  get value() { return this.navMenu.value; }

  onClickHandler() {
    if (!this.enabled) return;
    this.navMenu.setValue(this.to);
  }

  onIconClickHandler(event: MouseEvent) {
    if (!this.enabled) return;
    this.$emit('iconClick', this.to);
    event.stopPropagation();
  }

}
</script>

<style lang="less" scoped>
@import "../../styles/index";

.nav-item {
  cursor: pointer;
  list-style: none;
  border-left: 3px solid transparent;
  padding-left: 50px;
  opacity: 0.7;
  font-size: 14px;
  margin-bottom: 5px;

  &.active {
    opacity: 1;
    .semibold;
    border-color: @yellow;
    color: @navy;

    .fa {
      color: @yellow;
    }
  }

  &:hover {
    opacity: 1;
  }

  &.disabled {
    opacity: 0.3;
    cursor: default;
  }

  .fa {
    color: #999;
    position: relative;
    margin-right: -15px;
    left: -25px;
  }
}
.night-theme {
  .nav-item {
    &.active {
      color: @white;
    }
  }
}

</style>
