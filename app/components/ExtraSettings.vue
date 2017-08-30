<template>
<div>
  <div class="section">
    <p>
      If you are experiencing weird behavior, you can try deleting your cache directory.  This will result in you losing your scene configuration and settings, but can fix some stability issues.
    </p>
    <button class="button button--action" @click="showCacheDir">
      Show Cache Directory
    </button>
    <br/>
    <button class="button button--action" @click="deleteCacheDir">
      Delete Cache and Restart
    </button>
    <br/>
    <button class="button button--action" @click="uploadCacheDir" :disabled="cacheUploading">
      Upload Cache to Developers
      <i class="fa fa-spinner fa-spin" v-if="cacheUploading" />
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
import { CacheUploaderService } from '../services/cache-uploader';
import { Inject } from '../util/injector';

@Component({})
export default class ExtraSettings extends Vue {

  @Inject('OverlaysPersistenceService')
  overlaysService: OverlaysPersistenceService;

  @Inject()
  cacheUploaderService: CacheUploaderService;

  overlaySaving = false;

  cacheUploading = false;

  showCacheDir() {
    electron.remote.shell.showItemInFolder(electron.remote.app.getPath('userData'));
  }

  deleteCacheDir() {
    if (confirm('WARNING! You will lose all scenes, sources, and settings. This cannot be undone!')) {
      electron.remote.app.relaunch({ args: ['--clearCacheDir'] });
      electron.remote.app.quit();
    }
  }

  uploadCacheDir() {
    this.cacheUploading = true;
    this.cacheUploaderService.uploadCache().then(file => {
      electron.remote.clipboard.writeText(file);
      alert(`Your cache directory has been successfully uploaded.  The file name ${file} has been copied to your clipboard.  Please paste it into discord and tag a developer.`);
      this.cacheUploading = false;
    });
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
