<template>
<div>
  <div class="source-info">
    <div class="source-info__text">
      <h2>{{ name }}</h2>
      <div class="desc">{{ description }}</div>

      <div class="source-support" v-if="showSupport">
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

  h2 {
    .margin-bottom();
  }

  .desc {
    height: 62px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    .margin-bottom(2);
  }
}

.source-info__media {
  .radius();

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

.source-support {
  overflow: hidden;
}

.source-support__list {
  .margin-left(2);

  margin-bottom: 0;
  display: flex;
  flex-wrap: wrap;
  flex: 250px;
  height: 88px;
  flex-direction: column;

  li {
    padding-right: 50px;
  }
}

.source-info__body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
</style>
