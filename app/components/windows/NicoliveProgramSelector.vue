<template>
<modal-layout
  :title="$t('streaming.nicoliveProgramSelector.title')"
  :show-controls="false"
  :custom-controls="true">
  <div slot="content">
    {{ $t('streaming.nicoliveProgramSelector.description') }}
    <fieldset>
      <ul v-for="(info, key) in selectionInfo" :key="key">
        <input type="radio" :id="key" :value="key" v-model="selectedId">
        <label :for="key">{{ key + ": " + info.title + ": " + info.description }}</label>
        <br>
      </ul>
    </fieldset>
    <span>Picked: {{ selectedId }}</span>
  </div>
  <div slot="controls">
    <button
      class="button button--default"
      @click="cancel"
      data-test="Cancel">
      {{ $t('common.cancel') }}
    </button>
    <button
      class="button button--action"
      :disabled="disabledOk"
      @click="ok"
      data-test="Done">
      {{ $t('common.done') }}
    </button>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./NicoliveProgramSelector.vue.ts"></script>

<style lang="less" scoped>
.input-container {
  margin-top: 12px;
  flex-direction: column;
}
</style>
