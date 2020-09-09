<template>
<ModalLayout
  :title="title"
  :content-styles="{ padding: 0 }"
  :show-controls="false">
  <PlatformAppPageView
    slot="content"
    :appId="appId"
    :pageSlot="pageSlot" />
</ModalLayout>
</template>

<script lang="ts" src="./PlatformAppPopOut.vue.ts"></script>
