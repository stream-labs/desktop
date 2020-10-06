<template>
  <div>
    <div v-if="hotkeySet">
      <hotkey-group
        v-if="filteredHotkeySet.general.length > 0"
        :hotkeys="filteredHotkeySet.general"
        :isSearch="!!searchString"
      />
      <h2 v-if="hasHotkeys(filteredHotkeySet.scenes)">Scenes</h2>
      <hotkey-group
        v-for="(scenesHotkeys, sceneId) in filteredHotkeySet.scenes"
        v-if="scenesHotkeys.length > 0"
        :key="sceneId"
        :title="scenesService.views.getScene(sceneId).name"
        :hotkeys="scenesHotkeys"
        :isSearch="!!searchString"
      />
      <h2 v-if="hasHotkeys(filteredHotkeySet.sources)">Sources</h2>
      <hotkey-group
        v-for="(sourceHotkeys, sourceId) in filteredHotkeySet.sources"
        v-if="sourceHotkeys.length > 0"
        :key="sourceId"
        :title="sourcesService.views.getSource(sourceId).name"
        :hotkeys="sourceHotkeys"
        :isSearch="!!searchString"
      />
    </div>
  </div>
</template>

<script lang="ts" src="./Hotkeys.vue.ts"></script>
