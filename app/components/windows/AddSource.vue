<template>
<modal-layout
  :showControls="false"
  :title="$t('Add Source')">

  <div slot="content">

    <div v-if="sourceType != 'scene'">
      <div class="row">
        <div class="column small-12">
          <h4>{{ $t('Add New Source') }}</h4>
          <p
            v-if="!error"
            class="NameSource-label">
            {{ $t('Please enter the name of the source') }}
          </p>
          <p v-if="error"
            class="NameSource-label NameSource-label__error">
            {{ error }}
          </p>
          <input autofocus type="text" v-model="name"/>
        </div>
      </div>
      <div class="row">
        <div class="columns small-12 buttons">
          <button @click="addNew" class="button button--action">{{ $t('Add New Source') }}</button>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="columns small-12">
        <h4>
          {{ $t('Add Existing Source') }}
          <span
            v-if="propertiesManager === 'widget' && existingSources.length"
            class="recommended-label">
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
            @select="sourceId => { selectedSourceId = sourceId }"
            :activeItems="selectedSourceId ? [selectedSourceId] : []"
            :items="existingSources">
        </selector>
      </div>
      <div class="small-6 columns">
        <display v-if="selectedSource" :sourceId="selectedSource.id" />
      </div>
    </div>
    <div v-else class="row">
      <div class="small-12 columns">
        {{ $t('There are no existing sources of this type.') }}
      </div>
    </div>

    <div class="row" v-if="existingSources.length">
      <div class="columns small-12 buttons">
        <button
          @click="addExisting"
          :disabled="false"
          class="button button--action">
          {{ $t('Add Existing Source') }}
        </button>
      </div>
    </div>
  </div>

</modal-layout>
</template>

<script lang="ts" src="./AddSource.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.NameSource-label {
  margin-bottom: 10px;
}

.NameSource-label__error {
  color: @warning;
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
  color: @teal;
  margin-left: 10px;
  text-transform: none;
}

.studio-controls-selector {
  width: 100%;
}

</style>
