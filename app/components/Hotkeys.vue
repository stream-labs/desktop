<template>
<div>
  <hotkey-group
    :hotkeys="hotkeySet.general"/>
  <hotkey-group
    v-for="(scenesHotkeys, sceneId) in hotkeySet.scenes"
    :title="scenesService.getScene(sceneId).name"
    :hotkeys="scenesHotkeys"/>
  <hotkey-group
    v-for="(sourceHotkeys, sourceId) in hotkeySet.sources"
    :title="sourcesService.getSource(sourceId).displayName"
    :hotkeys="sourceHotkeys"/>
</div>
</template>

<script lang="ts" src="./Hotkeys.vue.ts"></script>
