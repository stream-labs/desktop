<template>
  <div>
    <div class="media-box">
      <div class="url-uploader" v-if="showUrlUpload">
        <form-group :title="$t('Image URL')" >
          <text-input v-model="url" :metadata="{ placeholder: `${$t('Example')}: https://yoururl.com/image/Streamlabs` }" />
        </form-group>
        <button class="button button--action" @click="uploadUrl">{{ $t('Submit') }}</button>
      </div>
      <img :src="value || metadata.clearImage" v-if="!showUrlUpload" >
      <div class="footer">
        <span class="filename">{{ fileName || 'Default' }}</span>
        <div class="flex flex--v-center">
          <a @click="updateValue">{{ $t('Change Media') }}</a>
          <i @click="toggleUrlUpload" class="icon-link" />
          <i @click="previewImage" class="fa fa-search-plus" />
          <i @click="clearImage" class="icon-close" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./MediaGalleryInput.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.media-box {
  .radius();
  position: relative;
  width: 100%;
  height: 120px;
  background-color: @day-section;

  img {
    max-height: 110px;
    width: auto;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

.footer {
  display: flex;
  position: absolute;
  width: auto;
  bottom: 1px;
  left: 1px;
  right: 1px;
  height: 30px;
  justify-content: space-between;
  padding: 6px;
  background: linear-gradient(rgba(0, 0, 0, 0), @night-accent-dark 40%);
  border-radius: 0 0 @radius @radius;

  i {
    margin-left: 10px;
  }

  .icon-close {
    color: @red;
  }
}

.filename {
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

i {
  transition: 0.1s all linear;

  &:hover {
    cursor: pointer;
    color: @white;
  }
}

.url-uploader {
  .radius();
  background-color: @day-primary;
  padding: 12px;
  position: absolute;
  top: 1px;
  bottom: 1px;
  right: 1px;
  left: 1px;

  button {
    position: absolute;
    bottom: 25px;
    right: 12px;
  }
}

.night-theme {
  .media-box {
    background-color: @night-secondary;
    border-color: @night-secondary;
  }

  .url-uploader {
    background-color: @night-primary;
  }
}
</style>
