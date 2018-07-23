<template>
  <span class="w-text-input">
    <input
      type="text"
      :placeholder="metadata.placeholder"
      :value="value"
      @input="emitInput($event.target.value)"
      :name="uuid"
      v-validate="validate"
    />
    <span class="input-error" v-show="errors.first(uuid)">
      {{ errors.first(uuid) }}
    </span>
  </span>
</template>

<script lang="ts" src="./WTextInput.vue.ts"></script>

<style lang="less" scoped>
  .w-text-input {
    position: relative;
    .input-error {
      position: absolute;
      white-space: nowrap;
    }
  }
</style>

// import { Component, Prop } from 'vue-property-decorator';
// import { IWInputMetadata, WInput } from './WInput';

// interface IWTextMetadata extends IWInputMetadata {
//   placeholder: string;
//   validate: string;
// }

// @Component({
// })
// export default class WTextAreaInput extends WInput<string, IWTextMetadata> {

//   @Prop()
//   value: string;

//   @Prop({ default: () => ({}) })
//   metadata: IWTextMetadata;

//   getValidations() {
//     return {
//       ...super.getValidations(),
//     };
//   }
// }
