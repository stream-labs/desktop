<template>
<widget-editor
  :slots="[{ value: 'layout', label: $t('Ad Layout') }]"
  :navItems="navItems"
>
  <validated-form slot="layout" @input="save()" v-if="loaded">
    <v-form-group :title="$t('Placement')">
      <list-input v-model="wData.settings.placement_options" :metadata="{ options: placementOptions }" />
    </v-form-group>
    <v-form-group v-if="wData.settings.placement_options === 'double'" :title="$t('Image Layout')">
      <image-layout-input v-model="wData.settings.layout" />
    </v-form-group>
  </validated-form>

  <validated-form
    @input="save()"
    v-if="loaded"
    v-for="position in positions"
    :key="position"
    :slot="`set-${position}-properties`"
  >
    <v-form-group :title="`${$t('Placement')} ${position} ${$t('Images')}`">
      <div v-for="image in wData.settings[`placement_${position}_images`]" :key="image.href" class="media-container">
        <media-gallery-input v-model="image.href" :metadata="{ fileName: fileNameFromHref(image.href) }" />
        <button class="close-button" @click="removeImage(image.href, position)"><i class="icon-close" /></button>
        <div>{{ $t('Image Duration') }}</div>
        <div class="duration"><number-input v-model="image.duration" :metadata="{}" /></div>
        <span>{{ $t('Seconds') }}</span>
      </div>
      <button class="button button--default" @click="addImage(position)" >{{ $t('Add Image') }}</button>
    </v-form-group>
  </validated-form>

  <validated-form slot="visual-properties" @input="save()" v-if="loaded">
    <v-form-group :title="$t('Widget Hide Duration')" :metadata="{ tooltip: hideDurationTooltip }">
      <timer-input v-model="wData.settings.hide_duration_in_seconds" :metadata="{}" />
    </v-form-group>
    <v-form-group :title="$t('Widget Show Duration')" :metadata="{ tooltip: showDurationTooltip }">
      <timer-input v-model="wData.settings.show_duration_in_seconds" :metadata="{}" />
    </v-form-group>
    <v-form-group :title="$t('Banner Width')">
      <slider-input v-model="wData.settings.banner_width" :metadata="{ max: 720, interval: 5 }" />
    </v-form-group>
    <v-form-group :title="$t('Banner Height')">
      <slider-input v-model="wData.settings.banner_height" :metadata="{ max: 720, interval: 5 }" />
    </v-form-group>
    <v-form-group :title="$t('Image Animation')" :metadata="{ tooltip: animationTooltip }">
      <animation-input v-model="wData.settings.show_animation" />
    </v-form-group>
    <v-form-group :title="$t('Background Color')">
      <bool-input v-model="wData.settings.background_color_option" :metadata="{ title: $t('Transparent') }" />
      <color-input v-if="!wData.settings.background_color_option" v-model="wData.settings.background_container_color" />
    </v-form-group>
  </validated-form>

</widget-editor>
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
