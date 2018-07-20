<template>
<ModalLayout
  :title="$t('Add Command')"
  :showControls="true"
>
  <div slot="fixed">
    <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTab">
    </Tabs>
  </div>
  <div slot="content">
    <div v-if="selectedTab === 'general'">
      <div>
        Command
        <WTextInput />
      </div>
      <div>
        Response
        <WTextAreaInput />
      </div>
    </div>
    <div v-if="selectedTab === 'advanced'">
      Advanced Stuff
    </div>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotAddCommand.vue.ts"></script>
