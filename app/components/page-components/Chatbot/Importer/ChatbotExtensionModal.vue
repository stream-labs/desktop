<template>
  <modal :name="MODAL_NAME" :height="'auto'" :maxHeight="600">
    <div class="item__container">
      <div class="item-modal__body">
        <h2>Streamlabs Extension Importer</h2>
        <span>{{$t('By importing you will overide your current Loyalty data.')}}</span>
      </div>
      <div class="item-modal__controls">
        <button
          class="button button--default"
          @click="cancelHandler"
        >{{ $t('Cancel') }}</button>
        <button
          class="button button--action"
          @click="continueHandler"
        >{{ $t('Continue') }}</button>
      </div>
    </div>
  </modal>
</template>
<script lang="ts" src="./ChatbotExtensionModal.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.item-modal__header {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 30px;
  border-bottom: 1px solid @day-border;

  .item-modal__header__icon {
    padding-left: 10px;
    width: 32px;
  }

  .item-modal__header__title {
    .text-transform();
    flex-grow: 1;
    .padding-left();
  }
}

.command-span {
  .margin-right();
}

.item-modal__body {
  .padding--20();
}

.item-modal__controls {
  background-color: @day-section;
  border-top: 1px solid @day-border;
  padding: 8px 16px;
  text-align: right;
  flex-shrink: 0;
  z-index: 10;

  .button {
    margin-left: 8px;
  }
}

.night-theme {
  .item-modal__header {
    border-bottom: 1px solid @night-border;
  }

  .item-modal__controls {
    border-top-color: @night-border;
    background-color: @night-primary;
  }
}
</style>
