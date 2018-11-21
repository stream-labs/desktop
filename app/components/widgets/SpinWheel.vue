<template>
<widget-editor :navItems="navItems" v-if="wData">
  <validated-form slot="manage-wheel-properties" @input="save()" v-if="loaded">
    <v-form-group v-model="wData.settings.resultTemplate" :metadata="metadata.resultTemplate" />
    <v-form-group v-model="wData.settings.resultColor" :metadata="metadata.resultColor" />
    <v-form-group v-model="wData.settings.hideTimeout" :metadata="metadata.hideTimeout" />
    <v-form-group v-model="wData.settings.rotationSpeed" :metadata="metadata.rotationSpeed" />
    <v-form-group v-model="wData.settings.slowRate" :metadata="metadata.slowRate" />
  </validated-form>

  <validated-form slot="categories-properties" @input="save()" v-if="loaded">
    <v-form-group>
      <button class="button button--action" @click="addCategory()">{{ $t('Add Category') }}</button>
      <button class="button button--default" @click="clearCategories()">{{ $t('Clear All') }}</button>
      <div v-for="category in wData.settings.categories" :key="category.prize" class="category-container">
        <text-input v-model="category.prize" />
        <div class="category-box">
          <color-input v-model="category.color" />
          <i class="icon-close" @click="removeCategory(category.prize)" />
        </div>
      </div>
    </v-form-group>
  </validated-form>

  <validated-form slot="section-properties" @input="save()" v-if="loaded">
    <v-form-group v-for="(section, i) in wData.settings.sections" :key="section.key">
      <div class="section-weight-box">
        <list-input v-model="section.category" :metadata="metadata.sectionWeightList" />
        <i v-if="i !== 0" class="fa fa-chevron-up" @click="moveSection(section.key, -1)" />
        <i v-if="i < wData.settings.sections.length - 1" class="fa fa-chevron-down" @click="moveSection(section.key, 1)" />
        <i class="icon-close" @click="removeSection(section.key)" />
      </div>
      <slider-input v-model="section.weight" :metadata="metadata.sectionWeightSlider" />
    </v-form-group>
  </validated-form>

  <validated-form slot="font-properties" @input="save()" v-if="loaded">
    <v-form-group v-model="wData.settings.font" :metadata="metadata.fontFamily" />
    <v-form-group v-model="wData.settings.fontColor" :metadata="metadata.fontColor" />
    <v-form-group v-model="wData.settings.fontSize" :metadata="metadata.fontSize" />
    <v-form-group v-model="wData.settings.fontWeight" :metadata="metadata.fontWeight" />
    <v-form-group v-model="wData.settings.labelText.height" :metadata="metadata.labelHeight" />
    <v-form-group v-model="wData.settings.labelText.width" :metadata="metadata.labelWidth" />
  </validated-form>

  <validated-form slot="border-properties" @input="save()" v-if="loaded">
    <v-form-group v-model="wData.settings.borderColor" :metadata="metadata.borderColor" />
    <v-form-group v-model="wData.settings.innerBorderWidth" :metadata="metadata.innerBorderWidth" />
    <v-form-group v-model="wData.settings.outerBorderWidth" :metadata="metadata.outerBorderWidth" />
  </validated-form>

  <validated-form slot="ticker-properties" @input="save()" v-if="loaded">
    <v-form-group v-model="wData.settings.ticker.url" :metadata="metadata.tickerUrl" />
    <v-form-group v-model="wData.settings.ticker.size" :metadata="metadata.tickerSize" />
    <v-form-group v-model="wData.settings.ticker.tone" :metadata="metadata.tickerTone" />
  </validated-form>

  <validated-form slot="image-properties" @input="save()" v-if="loaded">
    <v-form-group v-model="wData.settings.centerImage.enabled" :metadata="metadata.centerEnabled" />
    <v-form-group v-model="wData.settings.centerImage.default" :metadata="metadata.centerDefault" />
    <v-form-group v-model="wData.settings.centerImage.size" :metadata="metadata.centerSize" />
    <v-form-group v-model="wData.settings.centerImage.border.enabled" :metadata="metadata.centerBorderEnabled" />
    <v-form-group v-model="wData.settings.centerImage.border.color" :metadata="metadata.centerBorderColor" />
    <v-form-group v-model="wData.settings.centerImage.border.width" :metadata="metadata.centerBorderWidth" />
  </validated-form>
</widget-editor>
</template>

<script lang="ts" src="./SpinWheel.vue.ts"></script>

<style lang="less">
  .category-container {
    margin-top: 16px;
  }

  .category-box {
    display: flex;
    align-items: center;
    margin-top: 8px;

    i {
      margin-left: 4px;

      &:hover {
        cursor: pointer;
      }
    }
  }

  .section-weight-box {
    display: flex;
    align-items: center;
    position: relative;

    i {
      margin-left: 4px;

      &:hover {
        cursor: pointer;
      }
    }

    div {
      width: 140px;
      margin-right: auto;
      position: relative;

    }

    .multiselect__select {
      min-width: 0;
    }
  }
</style>
