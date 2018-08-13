<template>
<div class="banner" :class="[bannerExists ? 'show' : '']">
  <img class="bg-image" :src="currentBanner.thumbnail" />
  <div class="image-container">
    <img class="shadow-image__left" :src="currentBanner.thumbnail" />
    <img class="shadow-image__right" :src="currentBanner.thumbnail" />
    <img class="main-image" :src="currentBanner.thumbnail" />
  </div>
  <div>
    <div class="new-label">{{ $t('New') }}</div>
    <h3 class="title">{{ headerText }}</h3>
    <p class="subheading">{{ currentBanner.subHeader }}</p>
  </div>
  <div>
    <button class="button learn-more" @click="followLink">{{ currentBanner.linkTitle }}</button>
    <button class="dismiss-button" @click="closeBanner()">{{ $t('Dismiss') }}</button>
  </div>
</div>
</template>

<script lang="ts" src="./NewsBanner.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.banner{
  width: 100%;
  min-height: 0;
  max-height: 0;
  background-color: @teal;
  color: @white;
  display: flex;
  position: relative;
  align-content: center;
  justify-content: space-between;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0, 1, 0, 1);
}

.banner.show {
  min-height: 100px;
  max-height: 140px;
  padding: 20px;
  transition: all 0.5s ease-in-out;
}

.bg-image {
  position: absolute;
  opacity: 0.2;
  height: 400%;
  top: -100%;
  left: -100px;
}

.image-container {
  position: relative;
  left: 50px;
  width: 80px;
}

.shadow-image__left,
.shadow-image__right {
  opacity: 0.8;
  width: 80%;
  position: absolute;
  top: 10%;
}

.shadow-image__right {
  right: -30%;
}

.shadow-image__left {
  left: -30%;
}

.main-image {
  position: relative;
  width: auto;
  z-index: 1;
}

.new-label {
  .radius();
  background-color: @white;
  color: @black;
  padding: 2px 4px;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
}

.title {
  display: inline-block;
  font-size: 20px;
}

.subheading {
  display: block;
  max-width: 700px;
}

.learn-more {
  .new-label;
  padding: 0 12px;
}

.dismiss-button {
  display: block;
  text-decoration: underline;
  margin-top: 8px;
  width: 100%;
}
</style>
