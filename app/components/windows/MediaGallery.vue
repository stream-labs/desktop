<template>
<modal-layout
  :title="$t('Media Gallery')"
  :doneHandler="handleSelect">

  <div slot="content">
    <div class="container" @dragenter.prevent="onDragEnter" @dragover.prevent="onDragOver" @drop.prevent="handleFileDrop($event)">
      <input type="file" id="media-gallery-input" @change="handleUploadClick($event)" accept=".webm,.gif,.jpg,.png,.mp3,.ogg,.wav,.svg,.eps,.ai,.psd" multiple="multiple" style="display: none;">
      <div class="flex">
        <div class="left-panel">
          <div class="dropzone" @click="openFilePicker">
            <i class="icon-cloud-backup"></i>{{ $t('Drag & Drop Upload') }}
          </div>
          <ul v-for="(cat) in ['uploads', 'stock']" :key="cat" class="nav-list">
            <div>
              <div class="list__title">{{ cat === 'stock' ? $t('Stock Files') : $t('My Uploads') }}</div>
              <li class="list__item" :class="{ active: type === null && cat === category }" @click="handleTypeFilter(null, cat)">
                <i class="fa fa-file"></i>{{ $t('All Files') }}
              </li>
              <li class="list__item" :class="{ active: type === 'image' && cat === category }" @click="handleTypeFilter('image', cat)">
                <i class="icon-image"></i>{{ $t('Images') }}
              </li>
              <li class="list__item" :class="{ active: type === 'audio' && cat === category }" @click="handleTypeFilter('audio', cat)">
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
            <i class="icon-trash"
               :class="{ disabled: !selectedFile || selectedFile && selectedFile.isStock }"
               @click="handleDelete"
            ></i>
            <i class="fa fa-download" :class="[!selectedFile ? 'disabled' : '']" @click="handleDownload"></i>
          </div>
          <div>
            <div v-if="dragOver" @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" class="drag-overlay radius"></div>
            <div v-if="busy" class="busy-overlay"></div>
            <ul v-if="files.length" class="uploads-manager__list">
              <li v-for="file in files" :key="file.href" :class="[selectedFile && selectedFile.href === file.href ? 'selected' : '']" class="uploads-manager__item radius" @click.prevent="selectFile(file)" @dblclick.prevent="selectFile(file, true)">
                <div>
                  <div v-if="file.type === 'image' && /\.webm$/.test(file.href)">
                    <video loop :src="file.href" style="height: 100%; width: 100%"></video>
                  </div>
                  <div v-if="file.type == 'image' && !/\.webm$/.test(file.href)" class="image-preview" :style="'background-image: url(' + file.href + ')'" ></div>
                  <div v-if="file.type == 'audio'" style="height: 132px;">
                    <i class="icon-music" style="line-height: 132px; fontSize: 28px; textAlign: center; display: block"></i>
                  </div>
                  <button class="copy-button button button--action" @click="handleCopy(file.href)">
                    <i class="icon-copy"></i> {{ $t('Copy URL') }}
                  </button>
                  <div class="upload__footer" :class="[file.type === 'image' ? 'image' : '']">
                    <div class="upload__size">{{ file.size ? formatBytes(file.size) : ' ' }}</div>
                    <div class="upload__title">{{ file.fileName }}</div>
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
  width: 100%;
  font-family: Roboto;
}

.header {
  font-size: 16px;
  letter-spacing: 0;
  margin-bottom: 30px;
  color: var(--title);
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

.list__title {
  padding: 0;
  .weight(@bold);
}

.list__item {
  padding: 3px 8px;
  color: var(--paragraph);
  .weight(@medium);

  i {
    color: @grey;
    padding-right: 6px;
  }

  &:hover {
    cursor: pointer;
  }
}

.list__item.active {
  background-color: @teal-light-opac;
}

.progress-slider {
  position: relative;
  width: 100%;
  height: 6px;
  margin-bottom: 0;
  margin-top: 6px;
  background-color: var(--slider-bg);
}

.progress-slider__fill {
  background-color: var(--paragraph);
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
  border: 1px solid @teal-light-opac;
  .padding();
  .radius;
  background: var(--section);
  width: 100%;

  i {
    font-size: 20px;
    color: @teal-med-opac;
    margin-right: 8px;

    &:hover {
      color: @teal;
      cursor: pointer;
    }
  }

  i.disabled {
    color: var(--solid-input);

    &:hover {
      cursor: default;
    }
  }
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

.drag-overlay {
  border: 1px solid @yellow;
  background: rgba(255, 200, 0, 0.15);
  z-index: 100000;
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
}

.busy-overlay {
  position: absolute;
  top: 0;
  left: 0px;
  width: 100%;
  height: 100%;
  border: 1px solid var(--section);
  background: var(--shadow);
  z-index: 99999;
  .radius;
}

.uploads-manager__list {
  padding: 0;
  list-style: none;
  height: 400px;
  width: 100%;
  overflow-y: scroll;
  display: flex;
  margin: 10px 0 0;
  flex-wrap: wrap;
}

.copy-button {
  display: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.uploads-manager__item {
  border: 1px solid var(--border);
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
