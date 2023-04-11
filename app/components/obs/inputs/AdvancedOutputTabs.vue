<template>
  <div>
    <div class="section">
      <div class="section-content">
        <div class="standalone-properties">
          <div v-for="formGroup in standaloneProps">
            <GenericForm v-model="formGroup.parameters" @input="onInputHandler" />
          </div>
        </div>
        <tabs :tabs="tabs" :value="currentTab" @input="setCurrentTab">
          <div :slot="formGroup.nameSubCategory" v-for="formGroup in value">
            <div class="content">
              <GenericForm v-model="formGroup.parameters" @input="onInputHandler" />
            </div>
          </div>
          <div class="standalone-properties audio-properties" slot="Audio">
            <div v-for="formGroup in audioProps">
              <div class="section">
                <h2 class="section-title" v-if="formGroup.nameSubCategory !== 'Untitled'">
                  {{ $t(formGroup.nameSubCategory) }}
                </h2>
                <GenericForm v-model="formGroup.parameters" @input="onInputHandler" />
              </div>
            </div>
          </div>
        </tabs>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./AdvancedOutputTabs.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';

.content {
  .padding-top();
}

.standalone-properties {
  .margin-bottom();

  & .section {
    background-color: var(--shadow);
  }
}

.audio-properties {
  .margin-top();
}
</style>
