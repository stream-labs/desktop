<template>
<modal-layout
  :showControls="false"
  :title="$t('Media Gallery')">

  <div slot="content">
    <div class="container">
      <h1 class="header bold">Media Gallery</h1>
      <div>
        <input type="file" accept=".webm,.gif,.jpg,.png,.mp3,.ogg,.wav,.svg,.eps,.ai,.psd" multiple="multiple" style="display: none;">
        <div class="flex">
          <div class="left-panel">
            <div class="dropzone">
              <i class="icon-cloud-backup"></i>Drag &amp; Drop Upload
            </div>
            <ul class="nav-list">
              <div>
                <div class="bold">My Uploads</div>
                <li class="list__item"><a class="list__link semibold">
                  <i class="fa fa-file"></i>All Files
                </a></li>
                <li class="list__item"><a class="list__link semibold">
                  <i class="icon-image"></i>Images
                </a></li>
                <li class="list__item"><a class="list__link semibold">
                  <i class="icon-music"></i>Sounds
                </a></li>
              </div>
            </ul>
            <ul class="nav-list">
              <div>
                <div class="bold">Stock Files</div>
                <li class="list__item"><a class="list__link semibold">
                  <i class="fa fa-file"></i>All Files
                </a></li>
                <li class="list__item"><a class="list__link semibold">
                  <i class="icon-image"></i>Images
                </a></li>
                <li class="list__item"><a class="list__link semibold">
                  <i class="icon-music"></i>Sounds
                </a></li>
              </div>
            </ul>
            <div>
              <div>0KB / 1GB</div>
              <div class="progress-slider radius"><div></div></div>
            </div>
          </div>
          <div class="right-panel">
            <h4>Images</h4>
            <div class="toolbar">
              <i class="icon-cloud-backup"></i>
              <i class="icon-trash"></i>
            </div>
            <div>
              <div style="border: 1px solid rgb(255, 200, 0); background: rgba(255, 200, 0, 0.15); z-index: 100000; box-sizing: border-box; position: absolute; border-radius: 3px; top: 0px; left: 0px; height: 100%; width: 100%; display: none;"></div>
              <div style="text-align: center; margin-top: 160px;">
                <div>You don't have any uploaded images!</div>
                <div>
                  <button>Upload An Image</button>
                  <button>Browse the Gallery</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="submit-container">
      <button class="button button--default">Cancel</button>
      <button class="button button--action">Select</button>
    </div>
  </div>

</modal-layout>
</template>

<script lang="ts" src="./ManageSceneCollections.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.container {
  display: block;
  position: relative;
  top: 0;
  left: 0;
  padding: 30px;
  font-family: Roboto;
}

.header {
  font-size: 16px;
  letter-spacing: 0;
  margin-bottom: 30px;
  color: @white;
}

.left-panel {
  width: 180px;
}

.dropzone {
  border: 2px dashed @teal-med-opac;
  color: @teal-med-opac;
  text-align: center;
  padding: 10px 20px;
  font-size: 12px;
  margin-bottom: 20px;

  i {
    display: block;
    font-size: 24px;
  }

  &:hover {
    background-color: @teal-light-opac;
    color: @teal;
    border-color: @teal;
    cursor: pointer;
  }
}

.nav-list {
  list-style: none;
  margin-left: 0;
}

.list__item {
  padding: 3px 0;
}

.list__link {
  text-decoration: none;
  color: @white;
  i {
    color: @grey;
    padding-right: 6px;
  }
}

.progress-slider {
  width: 100%;
  height: 6px;
  margin-bottom: 0;
  margin-top: 6px;
  background-color: @night-slider-bg;
}

.right-panel {
  width: 100%;
  padding-left: 30px;
}

.toolbar {
  border: 1px solid @night-accent-light;
  padding: 8px;
  border-radius: 3px;
  background: @night-secondary;
  width: 100%;

  i {
    color: @teal-med-opac;

    &:hover {
      color: @teal;
      cursor: pointer;
    }
  }
}

.submit-container {
  display: flex;
  justify-content: flex-end;
  position: relative;
  left: 0;
  right: 0;
  padding-right: 30px;

  button {
    margin: 6px;
  }
}
</style>
