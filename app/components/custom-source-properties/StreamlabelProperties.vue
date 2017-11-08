<template>
<div>
  <div class="input-container select">
    <div class="input-label">
      <label>Label Type</label>
    </div>
    <div class="input-wrapper">
      <multiselect
        :options="statOptions"
        group-label="label"
        group-values="files"
        track-by="name"
        label="label"
        :value="currentlySelected"
        @input="handleInput"/>
    </div>
  </div>
  <div class="input-container">
    <div class="input-label">
      <label>Label Template</label>
    </div>
    <div class="input-wrapper">
      <input
        type="text"
        :value="labelTemplate"/>
      <div>
        <b>Tokens:</b>
        <span class="streamlabel-token" v-for="token in labelTemplateTokens">{{ token }} </span>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./StreamlabelProperties.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

.streamlabel-token {
  color: @teal;
}
</style>
