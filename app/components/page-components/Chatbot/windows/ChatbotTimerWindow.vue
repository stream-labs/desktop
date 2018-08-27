<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t(`${isEdit ? 'Edit' : 'Add'} Timer`)"
>
  <div slot="content">
    <div>
      <VFormGroup
        :title="$t('Name')"
        v-model="newTimer.name"
        :metadata="nameMetadata"
      />
      <VFormGroup
        :title="$t('Response (Line breaks will be ignored)')"
        v-model="newTimer.message"
        :metadata="messageMetadata"
      />
      <div class="row">
        <div class="columns small-6">
          <VFormGroup
            :title="$t('Interval (Value in Minutes)')"
            v-model="newTimer.interval"
            :metadata="intervalMetadata"
          />
        </div>
        <div class="columns small-6">
          <VFormGroup
            :title="$t('Line Minimum')"
            v-model="newTimer.chat_lines"
            :metadata="chatLinesMetadata"
          />
        </div>
      </div>
    </div>
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
      :disabled="errors.items.length > 0 || !newTimer.name || !newTimer.message"
    >
      {{ $t('Save') }}
    </button>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotTimerWindow.vue.ts"></script>

