<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Symbol Protection Preferences')"
>
  <div slot="fixed">
    <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTab">
    </Tabs>
  </div>
  <div slot="content" class="chatbot-symbol-protection__container">
    <transition name='fade' mode="out-in" appear>
      <div v-if="selectedTab === 'general' && symbolProtection">
        <div class="row">
          <div class="small-6 columns">
            <label for="excluded" class="margin-vertical--10">Auto Permit</label>
            <ListInput
              v-model="symbolProtection.general.excluded.level"
              :metadata="metadata.symbol.general.excluded.level"
            />
          </div>
          <div class="small-6 columns">
            <label for="punishment" class="margin-vertical--10">Punishment</label>
            <ListInput
              v-model="symbolProtection.general.punishment.type"
              :metadata="metadata.symbol.general.punishment.type"
            />
          </div>
        </div>
        <div v-if="symbolProtection.general.punishment.type === 'Timeout'">
          <label for="response" class="margin-vertical--10">Punishment Duration</label>
          <NumberInput
            v-model="symbolProtection.general.punishment.duration"
            :metadata="metadata.symbol.general.punishment.duration"
          />
        </div>
        <div>
          <label for="response" class="margin-vertical--10">Punishment Response</label>
          <TextAreaInput
            v-model="symbolProtection.general.message"
            :metadata="metadata.symbol.general.message"
          />
        </div>
      </div>
      <div v-if="selectedTab === 'advanced'">
        <div>
          <label for="response" class="margin-vertical--10">Minimum Amount of Symbols</label>
          <NumberInput
            v-model="symbolProtection.advanced.minimum"
            :metadata="metadata.symbol.advanced.minimum"
          />
        </div>
        <div>
          <label for="response" class="margin-vertical--10">Maximum Amount of Symbols</label>
          <NumberInput
            v-model="symbolProtection.advanced.maximum"
            :metadata="metadata.symbol.advanced.maximum"
          />
        </div>
        <div>
          <label for="response" class="margin-vertical--10">Maximum Percent</label>
          <SliderInput
            v-model="symbolProtection.advanced.percent"
            :metadata="metadata.symbol.advanced.percent"
          />
        </div>
      </div>
    </transition>
  </div>
  <div slot="controls">
    <button
      class="button button--default"
      @click="onCancel">
      Cancel
    </button>
    <button
      class="button button--action"
      @click="onSave"
    >
      {{ $t("Save") }}
    </button>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotSymbolProtectionWindow.vue.ts"></script>

<style <style lang="less" scoped>
.chatbot-symbol-protection__container {
  padding-top: 45px;
}
</style>
