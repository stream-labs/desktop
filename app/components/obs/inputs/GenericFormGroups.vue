<template>
  <div class="form-groups">
    <div
      class="section"
      v-for="(formGroup, groupIndex) in value"
      :key="formGroup.nameSubCategory"
      v-if="hasAnyVisibleSettings(formGroup)">

      <h2
        class="section-title section-title--dropdown"
        :class="{ 'section-title--opened': !collapsedGroups[groupIndex] }"
        v-if="formGroup.nameSubCategory != 'Untitled'"
        @click="toggleGroup(groupIndex)">
        <i class="fa fa-plus section-title__icon"  v-show="collapsedGroups[groupIndex]"></i>
        <i class="fa fa-minus section-title__icon" v-show="!collapsedGroups[groupIndex]"></i>
        {{ $t(formGroup.nameSubCategory) }}
      </h2>

      <div
        class="section-content"
        v-if="!collapsedGroups[groupIndex] || formGroup.nameSubCategory === 'Untitled'"
      >
        <GenericForm v-model="formGroup.parameters" @input="onInputHandler"></GenericForm>
      </div>

    </div>
  </div>
</template>

<script lang="ts" src="./GenericFormGroups.vue.ts"></script>

<style lang="less">
@import "../../../styles/index";

</style>
