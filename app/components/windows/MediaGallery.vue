<template>
<modal-layout
  :showControls="false"
  :title="$t('Media Gallery')">

  <div slot="content">
    <div class="container" @dragenter.prevent="" @dragover.prevent="onDragEnter" @dragleave.prevent="onDragLeave" @drop.prevent="handleFileDrop($event)">
      <h1 class="header bold">{{ $t('Media Gallery') }}</h1>
      <div>
        <input type="file" id="media-gallery-input" @change="handleUploadClick($event)" accept=".webm,.gif,.jpg,.png,.mp3,.ogg,.wav,.svg,.eps,.ai,.psd" multiple="multiple" style="display: none;">
        <div class="flex">
          <div class="left-panel">
            <div class="dropzone" @click="openFilePicker">
              <i class="icon-cloud-backup"></i>{{ $t('Drag & Drop Upload') }}
            </div>
            <ul class="nav-list">
              <div>
                <div class="bold">{{ $t('My Uploads') }}</div>
                <li class="list__item semibold" @click="handleTypeFilter(null, null)">
                  <i class="fa fa-file"></i>{{ $t('All Files') }}
                </li>
                <li class="list__item semibold" @click="handleTypeFilter('image', null)">
                  <i class="icon-image"></i>{{ $t('Images') }}
                </li>
                <li class="list__item semibold" @click="handleTypeFilter('audio', null)">
                  <i class="icon-music"></i>{{ $t('Sounds') }}
                </li>
              </div>
            </ul>
            <ul class="nav-list">
              <div>
                <div class="bold">Stock Files</div>
                <li class="list__item semibold" @click="handleTypeFilter(null, 'stock')">
                  <i class="fa fa-file"></i>{{ $t('All Files') }}
                </li>
                <li class="list__item semibold" @click="handleTypeFilter('image', 'stock')">
                  <i class="icon-image"></i>{{ $t('Images') }}
                </li>
                <li class="list__item semibold" @click="handleTypeFilter('audio', 'stock')">
                  <i class="icon-music"></i>{{ $t('Sounds') }}
                </li>
              </div>
            </ul>
            <div>
              <div>{{ totalUsageLabel }} / {{ maxUsageLabel }}</div>
              <div class="progress-slider radius">
                <div :style="'width: ' + (usagePct * 100) + '%'" class="progress-slider__fill radius"></div>
              </div>
            </div>
          </div>
          <div class="right-panel">
            <h4>{{ title }}</h4>
            <div class="toolbar">
              <i class="icon-cloud-backup" @click="openFilePicker"></i>
              <i class="icon-trash" :class="[selectedFile ? '': 'disabled']"></i>
            </div>
            <div>
              <div v-if="busy" class="busy-bar"></div>
              <ul class="uploads-manager__list" v-if="files.length">
                <li v-for="(file, i) in files" :key="i" :class="[selectedFile == file.href ? 'selected' : '']" class="uploads-manager__item radius" @click.prevent="selectFile(file)" @dblclick.prevent="selectFile(file, true)">
                  <div v-if="file.type == 'image' && /\.webm$/.test(file.href)">
                    <div>
                      <video loop :src="file.href" style="height: 100%; width: 100%"></video>
                    </div>
                    <button class="copy-button button button--action" :key="i" v-clipboard="file.href" @success="handleSuccess" @error="handleError">
                      <i class="icon-copy"></i> {{ $t('Copy URL') }}
                    </button>
                    <div class="upload__footer image">
                      <div class="upload__size">{{ file.size ? formatBytes(file.size) : ' ' }}</div>
                      <div class="upload__title">{{ file.filename }}</div>
                    </div>
                  </div>
                  <div v-if="file.type == 'image' && !/\.webm$/.test(file.href)">
                    <div class="image-preview" :style="'background-image: url(' + file.href + ')'" ></div>
                    <button class="copy-button button button--action" :key="i" v-clipboard="file.href" @success="handleSuccess" @error="handleError">
                      <i class="icon-copy"></i> {{ $t('Copy URL') }}
                    </button>
                    <div class="upload__footer image">
                      <div class="upload__size">{{ file.size ? formatBytes(file.size) : ' ' }}</div>
                      <div class="upload__title">{{ file.filename }}</div>
                    </div>
                  </div>
                  <div v-if="file.type == 'audio'">
                    <div style="height: 132">
                      <i class="icon-music" style="line-height: 132px; fontSize: 28px; textAlign: center; display: block"></i>
                    </div>
                    <button class="copy-button button button--action" :key="i" v-clipboard="file.href" @success="handleSuccess" @error="handleError">
                      <i class="icon-copy"></i> {{ $t('Copy URL') }}
                    </button>
                    <div class="upload__footer">
                      <div class="upload__size">{{ file.size ? formatBytes(file.size) : ' ' }}</div>
                      <div class="upload__title">{{ file.filename }}</div>
                    </div>
                  </div>
                </li>
              </ul>

              <div v-if="!files.length" class="empty-box">
                <div>{{ noFilesCopy }}</div>
                <div>
                  <button @click="openFilePicker">{{ noFilesBtn }}</button>
                  <button @click="handleBrowseGalleryClick">{{ $t('Browse the Gallery') }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="submit-container">
      <button class="button button--default" @click="handleClose">{{ $t('Cancel') }}</button>
      <button class="button button--action" @click="handleSelect">{{ $t('Select') }}</button>
    </div>
  </div>

</modal-layout>
</template>

<script lang="ts" src="./MediaGallery.vue.ts"></script>

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
  color: @white;

  i {
    color: @grey;
    padding-right: 6px;
  }

  &:hover {
    cursor: pointer;
  }
}

.progress-slider {
  position: relative;
  width: 100%;
  height: 6px;
  margin-bottom: 0;
  margin-top: 6px;
  background-color: @night-slider-bg;
}

.progress-slider__fill {
  background-color: @night-text;
  height: 6px;
  position: absolute;
  top: 0;
  left: 0;
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

.disabled {
  color: @night-accent-light;
}

.empty-box {
  text-align: center;
  margin-top: 160px;
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

.busy-bar {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  border: 1px solid @yellow;
  background: rgba(255, 200, 0, 0.23);
  z-index: 99999;
  border-radius: 3px;
}

.uploads-manager__list {
  padding: 0;
  margin: 0;
  list-style: none;
  height: 400px;
  display: inline-block;
  width: 100%;
  overflow-y: scroll;
  display: flex;
  margin-top: 10px;
  flex-wrap: wrap;
}

.copy-button {
  display: none;
  position: absolute;
  top: 50px;
  left: 35px;
}

.uploads-manager__item {
  border: 1px solid @night-border;
  width: 23%;
  margin: 0 14px 14px 0;
  height: 170px;
  cursor: default;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: @teal-med-opac;
    background-color: @teal-light-opac;

    .copy-button {
      display: inline-block;
    }
  }

  &.selected {
    border-color: @teal;
    background-color: @teal-light-opac;
  }
}

.image-preview {
  height: 132px;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.upload__size {
  color: @white;
  text-transform: uppercase;
  font-size: 12px;
}

.upload__footer {
  position: absolute;
  bottom: 0;
  display: inline-block;
  width: 100%;
  padding: 24px 10px 10px 10px;
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;

  &.image {
    background: linear-gradient(rgba(55, 71, 79, 0), rgba(55, 71, 79, 0.3), rgba(55, 71, 79, 0.6), rgba(55, 71, 79, 0.9));
    .upload__title {
      color: @white;
    }
    .upload__size {
      color: @grey;
    }
  }
}
</style>
