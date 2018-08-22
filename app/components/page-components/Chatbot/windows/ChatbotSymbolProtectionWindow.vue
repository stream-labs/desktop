<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Symbol Protection Preferences')"
>
  <div slot="fixed">
    <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler">
    </Tabs>
  </div>
  <div slot="content" class="chatbot-symbol-protection__container">
    <transition name='fade' mode="out-in" appear>
      <div v-if="selectedTab === 'general' && symbolProtection">
        <div class="row">
          <div class="small-6 columns">
            <label for="excluded" class="margin-vertical--10"> {{ $t('Auto Permit') }} </label>
            <ListInput
              v-model="symbolProtection.general.excluded.level"
              :metadata="metadata.symbol.general.excluded.level"
            />
          </div>
          <div class="small-6 columns">
            <label for="punishment" class="margin-vertical--10"> {{ $t('Punishment') }} </label>
            <ListInput
              v-model="symbolProtection.general.punishment.type"
              :metadata="metadata.symbol.general.punishment.type"
            />
          </div>
        </div>
        <div v-if="symbolProtection.general.punishment.type === 'Timeout'">
          <label for="response" class="margin-vertical--10"> {{ $t('Punishment Duration (Value in Minutes)') }} </label>
          <NumberInput
            v-model="symbolProtection.general.punishment.duration"
            :metadata="metadata.symbol.general.punishment.duration"
          />
        </div>
        <div>
          <label for="response" class="margin-vertical--10"> {{ $t('Punishment Response (Line breaks will be ignored)') }} </label>
          <TextAreaInput
            v-model="symbolProtection.general.message"
            :metadata="metadata.symbol.general.message"
          />
        </div>
      </div>
      <div v-if="selectedTab === 'advanced'">
        <div>
          <label for="response" class="margin-vertical--10"> {{ $t('Minimum Amount of Symbols') }} </label>
          <NumberInput
            v-model="symbolProtection.advanced.minimum"
            :metadata="metadata.symbol.advanced.minimum"
          />
        </div>
        <div>
          <label for="response" class="margin-vertical--10"> {{ $t('Maximum Amount of Symbols') }} </label>
          <NumberInput
            v-model="symbolProtection.advanced.maximum"
            :metadata="metadata.symbol.advanced.maximum"
          />
        </div>
        <div>
          <label for="response" class="margin-vertical--10"> {{ $t('Maximum Percent') }} </label>
          <SliderInput
            v-model="symbolProtection.advanced.percent"
            :metadata="metadata.symbol.advanced.percent"
          />
        </div>
      </div>
    </transition>
  </div>
  <div slot="controls" class="flex flex--space-between">
    <button
      class="button button--default"
      @click="onResetHandler">
      {{ $t('Reset') }}
    </button>
    <div>
      <button
        class="button button--default"
        @click="onCancelHandler">
        {{ $t('Cancel') }}
      </button>
      <button
        class="button button--action"
        @click="onSaveHandler"
        :disabled="errors.items.length > 0"
      >
        {{ $t("Save") }}
      </button>
    </div>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotSymbolProtectionWindow.vue.ts"></script>

<style <style lang="less" scoped>
.chatbot-symbol-protection__container {
  padding-top: 45px;
}
</style>
