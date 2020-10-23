<template>
  <div>
    <h-form-group :title="value.showDescription !== false ? value.description : null">
      <list-input
        :value="value.value"
        @input="onSelectHandler"
        @search-change="onSearchHandler"
        :metadata="metadata"
      />
      <!--      <div v-if="isCustom">-->
      <!--        <v-form-group-->
      <!--          :title="$t('width')"-->
      <!--          :value="width"-->
      <!--          :metadata="customDimensionMetadata"-->
      <!--          @input="onWidthInput"-->
      <!--        />-->
      <!--        <v-form-group-->
      <!--          :title="$t('height')"-->
      <!--          :value="height"-->
      <!--          :metadata="customDimensionMetadata"-->
      <!--          @input="onHeightInput"-->
      <!--        />-->
      <!--      </div>-->
    </h-form-group>
  </div>
</template>

<script lang="ts" src="./ObsResolutionInput.vue.ts"></script>
