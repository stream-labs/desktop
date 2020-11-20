<template>
  <div>
    <h-form-group :title="value.showDescription !== false ? value.description : null">
      <div v-if="!customMode" class="container">
        <list-input
          class="list-input"
          :value="value.value"
          @input="onSelectHandler"
          :metadata="metadata"
        />
        <button class="button button--default" @click="switchToCustomMode">
          {{ $t('Use Custom') }}
        </button>
      </div>
      <div v-else class="container">
        <VFormGroup
          class="custom-input"
          v-model="customWidth"
          :metadata="customFieldsMetadata.width"
        />
        <VFormGroup
          class="custom-input"
          v-model="customHeight"
          :metadata="customFieldsMetadata.height"
        />
        <VFormGroup>
          <button class="button button--action" @click="applyCustomRes">{{ $t('Apply') }}</button>
        </VFormGroup>
      </div>
    </h-form-group>
  </div>
</template>

<script lang="ts" src="./ObsResolutionInput.vue.ts"></script>

<style lang="less" scoped="true">
@import '../../../styles/index.less';
button {
  max-height: 32px;
}

.container {
  display: flex;
  width: 100%;
}

.list-input {
  flex: 1;
  .margin-right();
}

.custom-input {
  flex: 1;
  .margin-right();
}
</style>
