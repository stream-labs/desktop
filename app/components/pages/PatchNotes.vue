<template>
<div class="patch-notes-page">
  <div
    class="patch-notes-container patch-notes-container--opened">
    <div class="patch-notes-content">
      <header>
        {{ $t('onboarding.updateHeader') }}
      </header>
      <p class="patch-notes-version">
        {{ notes.version }}
      </p>
      <div class="patch-notes-wrap">
        <ul class="patch-notes-list">
          <li
            class="patch-notes-item"
            v-for="(item, index) in notes.notes"
            :key="index">
            {{ item }}
          </li>
        </ul>
      </div>
      <button
        @click="done"
        class="patch-notes-button button button--action">
        {{ $t('onboarding.updateDone') }}
      </button>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./PatchNotes.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.patch-notes-page {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.patch-notes-container {
  width: 480px;
  overflow: auto;
  position: absolute;
}

.patch-notes-content {
  position: relative;
}

.patch-notes-content > header {
  font-size: 16px;
  text-align: left;
  letter-spacing: .5px;
  padding-left: 24px;
  color: @text-secondary;
}

.patch-notes-version {
  font-size: 24px;
  font-weight: 400;
  margin: 24px 0;
  letter-spacing: .5px;
  text-align: center;
  color: @text-primary;
}

.patch-notes-wrap {
  width: 100%;
  overflow: hidden;
}

.patch-notes-list {
  margin-bottom: 32px;
  //foundation対応
  margin-right: 1.25rem;
  text-align: left;
  color: @text-secondary;
  //lessなので　width: calc(100% + 8px) ではなく↓で記述
  width: calc(~'100% + 8px');
  max-height: 160px;
  padding: 0 32px;
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;
}

.patch-notes-item {
  margin-bottom: 8px;
}

.patch-notes-button {
  width: 50%;
  margin: 0 auto;
  font-size: 20px;
}

</style>
