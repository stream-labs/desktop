<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Caps Protection Preferences')"
>
  <div slot="fixed">
    <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler">
    </Tabs>
  </div>
  <div slot="content" class="chatbot-caps-protection__container">
    <transition name='fade' mode="out-in" appear>
      <div v-if="selectedTab === 'general' && capsProtection">
        <div class="row">
          <div class="small-6 columns">
            <label for="excluded" class="margin-vertical--10"> {{ $t('Auto Permit') }} </label>
            <ListInput
              v-model="capsProtection.general.excluded.level"
              :metadata="metadata.caps.general.excluded.level"
            />
          </div>
          <div class="small-6 columns">
            <label for="punishment" class="margin-vertical--10"> {{ $t('Punishment') }} </label>
            <ListInput
              v-model="capsProtection.general.punishment.type"
              :metadata="metadata.caps.general.punishment.type"
            />
          </div>
        </div>
        <div v-if="capsProtection.general.punishment.type === 'Timeout'">
          <label for="response" class="margin-vertical--10"> {{ $t('Punishment Duration (Value in Minutes)') }} </label>
          <NumberInput
            v-model="capsProtection.general.punishment.duration"
            :metadata="metadata.caps.general.punishment.duration"
          />
        </div>
        <div>
          <label for="response" class="margin-vertical--10"> {{ $t('Punishment Response (Line breaks will be ignored)') }} </label>
          <TextAreaInput
            v-model="capsProtection.general.message"
            :metadata="metadata.caps.general.message"
          />
        </div>
      </div>
      <div v-if="selectedTab === 'advanced'">
        <div>
          <label for="response" class="margin-vertical--10"> {{ $t('Minimum Amount of Caps') }} </label>
          <NumberInput
            v-model="capsProtection.advanced.minimum"
            :metadata="metadata.caps.advanced.minimum"
          />
        </div>
        <div>
          <label for="response" class="margin-vertical--10"> {{ $t('Maximum Amount of Caps') }} </label>
          <NumberInput
            v-model="capsProtection.advanced.maximum"
            :metadata="metadata.caps.advanced.maximum"
          />
        </div>
        <div>
          <label for="response" class="margin-vertical--10"> {{ $t('Maximum Percent') }} </label>
          <SliderInput
            v-model="capsProtection.advanced.percent"
            :metadata="metadata.caps.advanced.percent"
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

<script lang="ts" src="./ChatbotCapsProtectionWindow.vue.ts"></script>

<style <style lang="less" scoped>
.chatbot-caps-protection__container {
  padding-top: 45px;
}
</style>
