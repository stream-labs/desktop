<template>
<div class="banner">
  <img class="bg-image" src="http://via.placeholder.com/150x150" />
  <div class="image-container">
    <img class="shadow-image__left" src="http://via.placeholder.com/150x150" />
    <img class="shadow-image__right" src="http://via.placeholder.com/150x150" />
    <img class="main-image" src="http://via.placeholder.com/150x150" />
  </div>
  <div>
    <div class="new-label">New</div>
    <h3 class="title">The Affiliate Program Has Arrived. $53,678 Has Been Paid Out So Far.</h3>
    <p class="subheading">If you use Streamlabs OBS, you’re probably already recommending it to your friends. Now you can earn revenue for your channel in the process.</p>
  </div>
  <div>
    <button class="button learn-more">{{ $t('Learn More') }}</button>
    <button class="dismiss-button">{{ $t('Dismiss') }}</button>
  </div>
</div>
</template>

<script lang="ts" src="./NewsBanner.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.banner{
  width: 100%;
  height: 100px;
  background-color: @teal;
  color: @white;
  padding: 20px;
  display: flex;
  position: relative;
  align-content: center;
  justify-content: space-between;
  overflow: hidden;
}

.bg-image {
  position: absolute;
  opacity: 0.2;
  height: 400%;
  top: -50%;
  left: -100px;
}

.image-container {
  position: relative;
  height: 100%;
  left: 50px;
}

.shadow-image__left,
.shadow-image__right {
  opacity: 0.8;
  height: 80%;
  width: auto;
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
  height: 100%;
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
