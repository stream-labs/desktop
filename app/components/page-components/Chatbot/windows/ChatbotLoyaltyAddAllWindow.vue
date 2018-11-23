<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
>
  <div slot="content" class="chatbot-loyalty-preferences__container">
    <validated-form ref="form">
      <VFormGroup
              :title="$t('Amount')"
              v-model="amount"
              :metadata="amountMetaData"
      />
    </validated-form>
  </div>
  <div slot="controls" class="flex flex--space-between">
    <div></div>
    <div>
      <button
        class="button button--default"
        @click="onCancelHandler">
        {{ $t('Cancel') }}
      </button>
      <button
        class="button button--action"
        @click="onOkHandler"
      >
        {{ $t("Ok") }}
      </button>
    </div>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotLoyaltyAddAllWindow.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
</style>
