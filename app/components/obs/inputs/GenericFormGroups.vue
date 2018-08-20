<template>
  <div class="form-groups">
    <div
      class="section"
      v-for="(formGroup, groupIndex) in value"
      :key="formGroup.nameSubCategory"
      v-if="hasAnyVisibleSettings(formGroup)"
      ref="container">

      <h2
        class="section-title section-title--dropdown"
        v-if="formGroup.nameSubCategory != 'Untitled'"
        @click="toggleGroup(groupIndex)">
        <i class="fa fa-plus section-title__icon"  v-show="collapsedGroups[groupIndex]"></i>
        <i class="fa fa-minus section-title__icon" v-show="!collapsedGroups[groupIndex]"></i>
        {{ $t(formGroup.nameSubCategory) }}
      </h2>

      <transition name="expand">
        <div
          class="section-content"
          :class="{ 'section-content--opened': formGroup.nameSubCategory != 'Untitled' }"
          v-if="!collapsedGroups[groupIndex] || formGroup.nameSubCategory === 'Untitled'"
        >
          <GenericForm v-model="formGroup.parameters" @input="onInputHandler"></GenericForm>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" src="./GenericFormGroups.vue.ts"></script>

<style lang="less">
@import "../../../styles/index";

.expand-enter {
  max-height: 0px;
  opacity: 0;
}

.expand-enter-active,
.expand-leave-active {
  transition: all .75s ease;
}

.expand-enter-to {
  max-height: 2000px;
  opacity: 1;
}

.expand-leave {
  opacity: 1;
  max-height: 2000px;
}

.expand-leave-to {
  max-height: 0px;
  opacity: 0;
}
</style>
