<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
>
  <div slot="content">
    <validated-form ref="form">
      <div>
        <VFormGroup
          :title="$t('Quote')"
          type="textArea"
          v-model="newQuote.message"
          :metadata="metadata.message"
        />
      </div>
      <div class="row">
        <div class="columns small-6">
          <VFormGroup
            :title="$t('Game')"
            type="text"
            v-model="newQuote.game"
            :metadata="metadata.game"
          />
        </div>
        <div class="columns small-6">
          <VFormGroup
            :title="$t('Added By')"
            type="text"
            v-model="newQuote.added_by"
            :metadata="metadata.added_by"
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
    >
      {{ $t('Save') }}
    </button>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotQuoteWindow.vue.ts"></script>

