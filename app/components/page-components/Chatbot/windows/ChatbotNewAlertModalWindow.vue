<template>
<modal
  name='new-alert'
  :height="300"
>
  <div class="new-alert-modal">
    <div class="new-alert-modal__header">
      <img class="new-alert-modal__header__icon" src="../../../../../media/images/icon.ico" />
      <div class="new-alert-modal__header__title">{{ $t(title) }}</div>
    </div>
    <div>
      {{ selectedType }}
    </div>
  </div>
</modal>
</template>
<script lang="ts" src="./ChatbotNewAlertModalWindow.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";
.new-alert-modal {
  .new-alert-modal__header {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 30px;
    border-bottom: 1px solid @day-border;

    .new-alert-modal__header__icon {
      padding-left: 10px;
      width: 32px;
    }

    .new-alert-modal__header__title {
      flex-grow: 1;
      padding-left: 10px;
    }
  }
}


.night-theme {
  .new-alert-modal {
    .new-alert-modal__header {
      border-bottom: 1px solid @night-border;
    }
  }

}


</style>
