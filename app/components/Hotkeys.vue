<template>
<div>
  <div v-if="hotkeySet">
    <v-form-group v-model="searchString" :metadata="{ type: 'text', name: 'search', title: $t('Search') }" />
    <hotkey-group
      v-if="filteredHotkeySet.general.length > 0"
      :hotkeys="filteredHotkeySet.general"/>
    <hotkey-group
      v-for="(scenesHotkeys, sceneId) in filteredHotkeySet.scenes"
      v-if="scenesHotkeys.length > 0"
      :key="sceneId"
      :title="scenesService.getScene(sceneId).name"
      :hotkeys="scenesHotkeys"/>
    <hotkey-group
      v-for="(sourceHotkeys, sourceId) in filteredHotkeySet.sources"
      v-if="sourceHotkeys.length > 0"
      :key="sourceId"
      :title="sourcesService.getSource(sourceId).name"
      :hotkeys="sourceHotkeys"/>
  </div>
</div>
</template>

<script lang="ts" src="./Hotkeys.vue.ts"></script>
