<template>
  <modal-layout :showControls="false" :customControls="true">
    <div slot="content">
      <div v-if="!isNewSource">
        <div class="row">
          <div class="columns small-12">
            <h4>
              {{ $t('Add Existing Source') }}
              <span
                v-if="sourceAddOptions.propertiesManager === 'widget' && existingSources.length"
                class="recommended-label"
              >
                {{ $t('Recommended') }}
              </span>
            </h4>
          </div>
        </div>
        <div class="sources-browser row" v-if="existingSources.length">
          <div class="small-6 columns">
            <selector
              class="studio-controls-selector"
              :draggable="false"
              @dblclick="addExisting"
              @select="
                sourceId => {
                  selectedSourceId = sourceId;
                }
              "
              :activeItems="selectedSourceId ? [selectedSourceId] : []"
              :items="existingSources"
            >
            </selector>
          </div>
          <div class="small-6 columns">
            <display v-if="selectedSource" :componentProps="{ sourceId: selectedSource.id }" />
          </div>
        </div>
      </div>

      <div v-if="isNewSource">
        <div class="row">
          <div class="column small-12">
            <h4>{{ $t('Add New Source') }}</h4>
            <p v-if="!error" class="NameSource-label">
              {{ $t('Please enter the name of the source') }}
            </p>
            <p v-if="error" class="NameSource-label NameSource-label__error">
              {{ error }}
            </p>
            <input autofocus type="text" style="width: 100%" v-model="name" />
          </div>
        </div>
      </div>
    </div>

    <div slot="controls">
      <div class="new-source-toggle">
        <h-form-group
          v-if="existingSources.length && sourceType !== 'scene'"
          v-model="overrideExistingSource"
          :metadata="{ title: $t('Add a new source instead'), type: 'toggle' }"
        />
      </div>
      <button class="button button--default" @click="close">{{ $t('Cancel') }}</button>
      <button class="button button--action" @click="handleSubmit">{{ $t('Add Source') }}</button>
    </div>
  </modal-layout>
</template>

<script lang="ts" src="./AddSource.vue.ts"></script>

<style lang="less" scoped>
@import '../../styles/index';

.NameSource-label {
  margin-bottom: 10px;
}

.NameSource-label__error {
  color: var(--warning);
}

.sources-container {
  padding: 20px;
  display: flex;
  flex: 1 0 auto;
  height: 170px;

  > div {
    flex: 1 0 50%;
  }
}

.sources-browser {
  .columns:first-child {
    display: flex;
  }

  .columns {
    height: 170px;
  }
}

.columns.buttons {
  text-align: right;
  padding-top: 20px;
  padding-bottom: 20px;
}

.recommended-label {
  color: var(--teal);
  margin-left: 10px;
}

.studio-controls-selector {
  width: 100%;
}

.new-source-toggle {
  position: absolute;
  bottom: 8px;

  /deep/ .input-label,
  /deep/ .input-body {
    width: auto;
  }
}
</style>
