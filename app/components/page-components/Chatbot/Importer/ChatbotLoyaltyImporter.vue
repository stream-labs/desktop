<template>
  <transition name="fade" mode="out-in" appear>
    <div class="importer-content">
      <div class="section import-section">
        <div class="section-content import-section__content">
          <span>{{ $t('Streamlabs Extension (Loyalty)') }}</span>
          <button
            v-if="!statusResponse || !statusResponse.extension"
            class="button button--action"
            @click="importExtensionHandler"
          >{{ $t('Import') }}</button>
          <span v-else>{{$t(statusResponse.extension)}}</span>
        </div>
      </div>
      <div class="section import-section">
        <div class="section-content import-section__content">
          <span>{{ $t('StreamElements (Commands, Timers, Loyalty)') }}</span>
          <button
            v-if="!statusResponse || !statusResponse.streamelements"
            class="button button--action"
            @click="importStreamElementsHandler"
          >{{ $t('Import') }}</button>
          <span v-else>{{$t(statusResponse.streamelements)}}</span>
        </div>
      </div>
      <ChatbotExtensionModal/>
      <ChatbotStreamElementsModal/>
    </div>
  </transition>
</template>

<script lang='ts' src="./ChatbotLoyaltyImporter.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';

.import-section {
  .margin-bottom();

  .import-section__content {
    .flex();
    .flex--space-between();
    .flex--v-center();
    .padding-bottom(2);
  }

  span {
    font-weight: 500;
  }

  .button {
    margin-right: 0px;
  }
}
</style>
