<template>
<div class="banner" :class="[bannerExists ? 'show' : '']">
  <img class="bg-image" :src="currentBanner.thumbnail" />
<<<<<<< HEAD
  
=======
>>>>>>> staging
  <div class="image-container">
    <img class="shadow-image__left" :src="currentBanner.thumbnail" />
    <img class="shadow-image__right" :src="currentBanner.thumbnail" />
    <img class="main-image" :src="currentBanner.thumbnail" />
  </div>
  <div class="title-container">
    <h3 class="title">{{ headerText }}</h3>
    <p class="subheading">{{ currentBanner.subHeader }}</p>
  </div>
  <div class="cta-container">
    <button class="button learn-more" @click="followLink()" :disabled="!bannerExists">{{ currentBanner.linkTitle }}</button>
    <button class="dismiss-button" @click="closeBanner()" :disabled="!bannerExists || processingClose">{{ $t('Dismiss') }}</button>
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
  opacity: 0.1;
  height: 400%;
  top: -100%;
  left: -100px;
  filter: blur(6px);
}

.image-container {
  position: relative;
  margin-left: 50px;
  width: 80px;

  img {
    top: 50%;
    transform: translate(0, -50%);
  }
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

.title-container {
  z-index: 1;
  margin-left: 50px;
}

.title {
  display: inline-block;
  font-size: 20px;
}

.subheading {
  display: block;
  max-width: 900px;
  color: @white;
}

.cta-container {
  margin-left: auto;
}

.learn-more {
  background-color: @white;
  color: @black;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
  padding: 0 12px;
}

.dismiss-button {
  display: block;
  text-decoration: underline;
  margin-top: 8px;
  width: 100%;
}
</style>
