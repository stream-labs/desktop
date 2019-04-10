
<template>
  <ModalLayout :showControls="false" :customControls="true" :containsTabs="false">
    <div slot="content">
      <validated-form ref="form" slot="content" class="chatbot-symbol-protection__container" v-if="newRegular">
        <VFormGroup
          v-model="newRegular.platform"
          :metadata="metaData.platform"
        />
        <VFormGroup
          v-model="newRegular.user"
          :metadata="metaData.user"
        />
      </validated-form>
    </div>
    <div slot="controls" class="flex flex--space-between">
      <div></div>
      <div>
        <button class="button button--default" @click="onCancelHandler">{{ $t('Cancel') }}</button>
        <button
          class="button button--action"
          @click="onSaveHandler"
          :disabled="errors.items.length > 0"
        >{{ $t("Save") }}</button>
      </div>
    </div>
  </ModalLayout>
</template>

<script lang='ts' src="./ChatbotRegularWindow.vue.ts"></script>