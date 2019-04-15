<template>
<div>
  <div
    class="widget"
    :class="{ selected }"
    @click="$emit('inspect')">
    <div class="widget__icon">
      <slot name="icon"></slot>
    </div>
    <div class="widget__info">
      <div class="widget__name">{{ name }}</div>
      <div class="widget__desc">
        {{ description }}
      </div>
    </div>
  </div>
  <div
    class="widget-detail-wrapper"
    v-if="inspected"
    @click="$emit('close')">
    <div class="widget-detail" @click.stop="() => {}">
      <div class="widget-detail__header">
        <div class="flex flex--center">
          <div class="widget__icon">
            <slot name="icon"></slot>
          </div>
          <div class="widget__info">
            <div class="widget__name">{{ name }}</div>
            <div class="widget__desc">{{ description }}</div>
          </div>
        </div>
        <div class="flex flex--center">
          <button
            class="button button--default"
            @click="$emit('toggle') + $emit('close')">
            {{ buttonTextForWidget() }}
          </button>
          <div
            class="widget-detail-close"
            @click="$emit('close')">
            <i class="fa fa-times" />
          </div>
        </div>
      </div>
      <div class="widget-detail__body">
        <slot name="body"></slot>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./SelectableWidget.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.widget {
  margin: 20px 10px 0;
  border: 2px solid transparent;
  .radius;
  background: var(--button);
  padding: 12px;
  text-align: left;
  display: flex;
  cursor: pointer;
  .transition;
  position: relative;

  &:hover {
    border-color: var(--teal-semi);
  }

  &.selected {
    border-color: var(--teal);

    &:before {
      content: '\f00c';
      font-family: "Font Awesome 5 Free";
      font-weight: 900;
      color: var(--teal);
      position: absolute;
      top: 6px;
      right: 10px;
    }
  }
}

.widget__icon {
  width: 34px;
  flex: 0 0 auto;
  margin-right: 20px;
}

.widget__info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: left;
}

.widget__name {
  .weight(@medium);
  color: var(--white);
  font-size: 14px;
}

.widget__desc {
  color: var(--icon);
  font-size: 13px;
}

.widget-detail-wrapper {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background: rgba(43,56,63, .85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.widget-detail {
  .radius;
  background: var(--link);
  overflow: hidden;
  width: 80%;
  min-width: 550px;
  max-width: 750px;
}

.widget-detail-close {
  color: var(--icon);
  .transition;
  margin-left: 20px;
  cursor: pointer;

  &:hover {
    color: var(--white);
  }
}

.widget-detail__header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
}

.widget-detail__body {
  overflow: hidden;

  video {
    height: 430px;
    display: flex;
    margin: -3px -1% -1px -1%;
  }
}
</style>
