<template>
<div>
  <div class="source-info">
    <div class="source-info__media">
      <slot name="media"></slot>
    </div>

    <div class="source-info__text">
      <h3>{{ $t(`source-props.${sourceType}.name`) }}</h3>
      <div class="desc">{{ $t(`source-props.${sourceType}.description`) }}</div>
      <p class="attention" v-if="showAttention">
        <slot name="attention-text"></slot>
      </p>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./AddSourceInfo.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

.source-info--no-selection {
  ol {
    margin-left: 12px;
    li {
      margin-bottom: 8px;
    }
  }
}

.source-info__media {
  text-align: center;
  align-items: center;
  align-content: center;
  max-height: 150px;
  justify-content: center;
  display: flex;
  flex: 1;
}

.source-info__text {
  flex:2;

  h3,
  .desc {
    margin-bottom: 12px;
  }
}

.source-support__list {
  margin-bottom: 0;
  margin-left: 15px;
  display: flex;
  flex-wrap: wrap;
  flex: 250px;
  height: 64px;
  flex-direction: column;

  li {
    padding-right: 50px;
  }
}

.source-support__label {
  font-size: 11px;

  letter-spacing: .7px;
  .semibold;
  margin-bottom: 5px;
}

.source-info__body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
</style>
