<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t(`${isEdit ? 'Edit' : 'Add'} Timer`)"
>
  <div slot="content">
    <div>
      <div>
        <label for="timer" class="margin-vertical--10"> {{ $t('Name') }} </label>
        <TextInput
          v-model="newTimer.name"
          :metadata="nameMetadata"
        />
      </div>
      <div>
        <label for="response" class="margin-vertical--10"> {{ $t('Response (Line breaks will be ignored)') }} </label>
        <TextAreaInput
          v-model="newTimer.message"
          :metadata="messageMetadata"
        />
      </div>
      <div class="row">
        <div class="columns small-6">
          <label for="interval" class="margin-vertical--10"> {{ $t('Interval (Value in Minutes)') }} </label>
          <NumberInput
            v-model="newTimer.interval"
            :metadata="intervalMetadata"
          />
        </div>
        <div class="columns small-6">
          <label for="line" class="margin-vertical--10"> {{ $t('Line Minimum') }} </label>
          <NumberInput
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

