<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Caps Protection Preferences')"
>
  <div slot="fixed">
    <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTab">
    </Tabs>
  </div>
  <div slot="content" class="chatbot-caps-protection__container">
    <transition name='fade' mode="out-in" appear>
      <div v-if="selectedTab === 'general' && capsProtection">
        <div class="row">
          <div class="small-6 columns">
            <label for="excluded" class="margin-vertical--10">Auto Permit</label>
            <ListInput
              v-model="capsProtection.general.excluded.level"
              :metadata="metadata.caps.general.excluded.level"
            />
          </div>
          <div class="small-6 columns">
            <label for="punishment" class="margin-vertical--10">Punishment</label>
            <ListInput
              v-model="capsProtection.general.punishment.type"
              :metadata="metadata.caps.general.punishment.type"
            />
          </div>
        </div>
        <div v-if="capsProtection.general.punishment.type === 'Timeout'">
          <label for="response" class="margin-vertical--10">Punishment Duration</label>
          <NumberInput
            v-model="capsProtection.general.punishment.duration"
            :metadata="metadata.caps.general.punishment.duration"
          />
        </div>
        <div>
          <label for="response" class="margin-vertical--10">Punishment Response</label>
          <TextAreaInput
            v-model="capsProtection.general.message"
            :metadata="metadata.caps.general.message"
          />
        </div>
      </div>
      <div v-if="selectedTab === 'advanced'">
        <div>
          <label for="response" class="margin-vertical--10">Minimum Amount of Caps</label>
          <NumberInput
            v-model="capsProtection.advanced.minimum"
            :metadata="metadata.caps.advanced.minimum"
          />
        </div>
        <div>
          <label for="response" class="margin-vertical--10">Maximum Amount of Caps</label>
          <NumberInput
            v-model="capsProtection.advanced.maximum"
            :metadata="metadata.caps.advanced.maximum"
          />
        </div>
        <div>
          <label for="response" class="margin-vertical--10">Maximum Percent</label>
          <SliderInput
            v-model="capsProtection.advanced.percent"
            :metadata="metadata.caps.advanced.percent"
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

<script lang="ts" src="./ChatbotCapsProtectionWindow.vue.ts"></script>

<style <style lang="less" scoped>
.chatbot-caps-protection__container {
  padding-top: 45px;
}
</style>
