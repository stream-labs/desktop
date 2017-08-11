<template>
<div>
  <div class="section">
    <p>
      If you are experiencing weird behavior, you can try deleting your cache directory.  This will result in you losing your scene configuration and settings, but can fix some stability issues.  The application can not be running when you delete your cache directory.
    </p>
    <button class="button button--action" @click="showCacheDir">
      Show Cache Directory
    </button>
  </div>
  <!-- TODO: Uncomment when we want to expose this feature -->
  <!-- <div class="section">
    <p>
      This will export your current scene configuration as a reusable overlay that can be used as a base scene config by other people.  This is an experimental feature.
    </p>
    <button class="button button--action" @click="exportOverlay" :disabled="overlaySaving">
      Export as Overlay
    </button>
  </div> -->
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import electron from '../vendor/electron';
import { Component } from 'vue-property-decorator';
import { OverlaysPersistenceService } from '../services/config-persistence';

@Component({})
export default class ExtraSettings extends Vue {

  overlaysService: OverlaysPersistenceService = OverlaysPersistenceService.instance;

  overlaySaving = false;

  showCacheDir() {
    electron.remote.shell.showItemInFolder(electron.remote.app.getPath('userData'));
  }

  exportOverlay() {
    const path = electron.remote.dialog.showSaveDialog({
      filters: [{ name: 'Overlay File', extensions: ['overlay'] }]
    });

    if (!path) return;

    this.overlaySaving = true;

    this.overlaysService.saveOverlay(path).then(() => {
      this.overlaySaving = false;
    });
  }

}
</script>
