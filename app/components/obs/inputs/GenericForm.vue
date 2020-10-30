<template>
  <div>
    <div v-for="(parameter, inputIndex) in value" :key="parameter.name">
      <component
        v-if="parameter.visible && propertyComponentForType(parameter.type)"
        :is="propertyComponentForType(parameter.type)"
        :value="value[inputIndex]"
        :data-test-category="category"
        :data-test-subCategory="subCategory"
        @input="value => onInputHandler(value, inputIndex)"
      />
    </div>
  </div>
</template>

<script lang="ts" src="./GenericForm.vue.ts"></script>
