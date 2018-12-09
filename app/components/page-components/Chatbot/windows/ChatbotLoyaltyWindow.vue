<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
>
  <div slot="content">
    <validated-form ref="form">
      <div class="row loyalty-name__container">
          <div class="columns small-6">
            <i class="icon-user"></i><span class="loyalty-name__label">{{ $t(newLoyalty.viewer.name) }}</span>
          </div>
      </div>
      <div class="row">
        <div class="columns small-6">
          <VFormGroup
            :title="$t('Points')"
            v-model="newLoyalty.points"
            :metadata="pointsMetaData"
          />
        </div>
        <div class="columns small-6">
          <VFormGroup
            :title="$t('Time Watched (Value in Minutes)')"
            v-model="newLoyalty.time"
            :metadata="timeMetaData"
          />
        </div>
      </div>  
    </validated-form>
  </div>
  <div slot="controls">
    <button
      class="button button--default"
      @click="onCancelHandler">
      {{ $t('Cancel') }}
    </button>
    <button
      class="button button--action"
      @click="onSaveHandler"
      :disabled="errors.items.length > 0"
    >
      {{ $t('Save') }}
    </button>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotLoyaltyWindow.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.loyalty-name__container {
  .margin-bottom(2)
}
.loyalty-name__label {
  font-size: 16px;
  .margin-left()
}
</style>
