<template>
<modal-layout
  :showControls="false"
>

  <div slot="content" data-test="AddSource">

    <div v-if="sourceType != 'scene'">
      <div class="row">
        <div class="column small-12">
          <h4>{{ $t('sources.addNewSourceTitle') }}</h4>
          <p
            v-if="!error"
            class="NameSource-label">
            {{ $t('sources.enterTheNameOfSource') }}
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
          <button @click="addNew" class="button button--primary" data-test="AddNewSource">{{ $t('sources.addNewSource') }}</button>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="columns small-12">
        <h4>
          {{ $t('sources.addExistingSourceTitle') }}
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
        {{ $t('sources.noSameTypeSources') }}
      </div>
    </div>

    <div class="row" v-if="existingSources.length">
      <div class="columns small-12 buttons">
        <button
          @click="addExisting"
          class="button button--primary"
          data-test="AddExistingSource"
        >
          {{ $t('sources.addExistingSource') }}
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
  color: var(--color-text);
  margin-bottom: 8px;
}

.NameSource-label__error {
  color: var(--color-error);
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
  color: @accent;
  margin-left: 10px;
}

.studio-controls-selector {
  width: 100%;
}

</style>
