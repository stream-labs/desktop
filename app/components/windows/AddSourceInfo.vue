<template>
<div>
  <div class="source-info">
    <div class="source-info__text">
      <h3>{{ name }}</h3>
      <div class="desc">{{ description }}</div>

      <div class="source-support" v-if="showSupport">
        <div class="source-support__label">{{ $t('Supports') }}</div>
        <slot name="support-list"></slot>
      </div>
    </div>

    <div class="source-info__media">
      <slot name="media"></slot>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./AddSourceInfo.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.source-info--no-selection {
  ol {
    margin-left: 15px;

    li {
      margin-bottom: 10px;
    }
  }
}

.source-info__text {
  flex: 0 0 50%;

  h3,
  .desc {
    margin-bottom: 12px;
  }
}

.source-info__media {
  .radius;
  overflow: hidden;
  text-align: center;
  padding-left: 20px;
  align-items: center;
  align-content: center;
  max-height: 150px;
  justify-content: center;
  display: flex;
  flex: 0 0 50%;

  video,
  img {
    width: auto;
    max-height: 150px;
    max-width: 100%;
    .radius;
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
  text-transform: uppercase;
  .letter-spacing();
  .weight(@medium);
  margin-bottom: 5px;
}

.source-info__body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
</style>
