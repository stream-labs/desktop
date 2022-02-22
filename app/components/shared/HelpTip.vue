<template>
  <div class="help-tip" v-if="shouldShow && !compactMode">
    <div class="help-tip__arrow"></div>
    <i @click="closeHelpTip" class="help-tip__close icon-close" />
    <div class="help-tip__title">
      <i class="icon-notification" />
      <slot name="title"></slot>
    </div>
    <div class="help-tip__body"><slot name="content"></slot>
    </div>
  </div>
</template>

<script lang="ts" src="./HelpTip.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.help-tip {
  position: absolute;
  background: @text-primary;
  .radius;
  color: @hover;
  top: -8px;
  left: 90px;
  width: 240px;
  padding: 8px;
  font-size: 14px;
  z-index: 100000;
  white-space: initial;
}

.help-tip__arrow {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8px 8px 8px 0;
  border-color: transparent @text-primary transparent transparent;
  position: absolute;
  left: -8px;
}

.help-tip__close {
  position: absolute;
  right: 10px;
  font-size: 20px;
  cursor: pointer;
  opacity: .6;
  .transition();

  &:hover {
    opacity: 1;
  }
}

.help-tip__title {
  .semibold;
  font-size: 16px;
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid @hover;

  i {
    margin-right: 8px;
    font-size: 16px;
  }
}

</style>
