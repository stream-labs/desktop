<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t(`${isEdit ? 'Edit' : 'Add'} Timer`)"
>
  <div slot="content">
    <div>
      <div>
        <label for="timer" class="margin-vertical--10">Name</label>
        <TextInput
          v-model="newTimer.name"
          :metadata="nameMetadata"
        />
      </div>
      <div>
        <label for="response" class="margin-vertical--10">Response</label>
        <TextAreaInput
          v-model="newTimer.message"
          :metadata="messageMetadata"
        />
      </div>
      <div class="row">
        <div class="columns small-6">
          <label for="interval" class="margin-vertical--10">Interval in mins</label>
          <NumberInput
            v-model="newTimer.interval"
            :metadata="intervalMetadata"
          />
        </div>
        <div class="columns small-6">
          <label for="line" class="margin-vertical--10">Line Minimum</label>
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
      @click="onCancel">
      Cancel
    </button>
    <button
      class="button button--action"
      @click="onSave"
    >
      <!-- <i class="fa fa-spinner fa-pulse" v-if="updatingInfo" /> -->
      Save
    </button>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotTimerWindow.vue.ts"></script>

