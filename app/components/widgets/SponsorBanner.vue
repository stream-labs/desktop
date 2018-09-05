<template>
<widget-window :requestState="requestState" :loaded="loaded"  ref="layout" v-model="tabName">
  <div slot="settings" >
    <form-group :title="$t('Widget Hide Duration')" :metadata="{ tooltip: hideDurationTooltip }">
      <div class="duration"><number-input v-model="wData.settings.hide_duration" :metadata="{}" /></div>
      <span>{{ $t('mins') }}</span>
      <div class="duration"><number-input v-model="wData.settings.hide_duration_secs" :metadata="{}" /></div>
      <span>{{ $t('secs') }}</span>
    </form-group>
    <form-group :title="$t('Widget Show Duration')" :metadata="{ tooltip: showDurationTooltip }">
      <div class="duration"><number-input v-model="wData.settings.show_duration" :metadata="{}" /></div>
      <span>{{ $t('mins') }}</span>
      <div class="duration"><number-input v-model="wData.settings.show_duration_secs" :metadata="{}" /></div>
      <span>{{ $t('secs') }}</span>
    </form-group>

    <form-group :title="$t('Banner Width')">
      <slider-input v-model="wData.settings.banner_width" :metadata="{ max: 720, interval: 5 }" />
    </form-group>
    <form-group :title="$t('Banner Height')">
      <slider-input v-model="wData.settings.banner_height" :metadata="{ max: 720, interval: 5 }" />
    </form-group>
    <form-group :title="$t('Image Animation')" :metadata="{ tooltip: animationTooltip }">
      <animation-input v-model="wData.settings.show_animation" />
    </form-group>
    <form-group :title="$t('Background Color')">
      <bool-input v-model="wData.settings.background_color_option" :metadata="{ title: $t('Transparent') }" />
      <color-input v-if="!wData.settings.background_color_option" v-model="wData.settings.background_container_color" />
    </form-group>
    <form-group :title="$t('Placement')">
      <list-input v-model="wData.settings.placement_options" :metadata="{ options: placementOptions }" />
    </form-group>
    <form-group v-if="wData.settings.placement_options === 'double'" :title="$t('Image Layout')">
      <image-layout-input v-model="wData.settings.layout" />
    </form-group>

    <form-group v-for="position in positions" :key="position" :title="`${$t('Placement')} ${position} ${$t('Images')}`">
      <div v-for="image in wData.settings[`placement_${position}_images`]" :key="image.href" class="media-container">
        <media-gallery-input v-model="image.href" :metadata="{ fileName: fileNameFromHref(image.href) }" />
        <button class="close-button" @click="removeImage(image.href, position)"><i class="icon-close" /></button>
        <div>{{ $t('Image Duration') }}</div>
        <div class="duration"><number-input v-model="image.duration" :metadata="{}" /></div>
        <span>{{ $t('Seconds') }}</span>
      </div>
      <button class="button button--default" @click="addImage(position)" >{{ $t('Add Image') }}</button>
    </form-group>
  </div>

  <div slot="HTML" >
    <code-editor v-model="wData" :metadata="{ type: 'html' }"/>
  </div>

  <div slot="CSS" >
    <code-editor v-model="wData" :metadata="{ type: 'css' }"/>
  </div>

  <div slot="JS" >
    <code-editor v-model="wData" :metadata="{ type: 'js' }"/>
  </div>

</widget-window>
</template>

<script lang="ts" src="./SponsorBanner.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.media-container {
  position: relative;
  width: 90%;
  margin-bottom: 20px;
}

.close-button {
  position: absolute;
  color: @red;
  top: 0;
  right: -20px;
  font-size: 13px;
}

.duration {
  width: 50px;
  display: inline-block;
}
</style>
