<template>
<widget-editor :navItems="navItems" v-if="wData">
  <validated-form slot="manage-wheel-properties" @input="save()" v-if="loaded">
    <v-form-group :title="$t('Results Template')" type="textarea" v-model="wData.settings.resultTemplate" />
    <v-form-group :title=":$t('Hide Timeout')" type="slider" v-model="wData.settings.hideTimeout" />
    <v-form-group :title="$t('Rotation Speed')" type="number" v-model="wData.settings.rotationSpeed" />
    <v-form-group :title="$t('Slowdown Rate')" type="number" v-model="wData.settings.slowRate" />
  </validated-form>

  <validated-form slot="categories-properties" @input="save()" v-if="loaded">
    <button @click="addCategory()">{{ $t('Add Category') }}</button>
    <button @click="clearCategories()">{{ $t('Clear All') }}</button>
    <v-form-group :title="$t('Categories')">
      <div v-for="category in wData.settings.categories">
        <text-input v-model="category.prize" /><color-input v-model="category.color" /><i class="icon-close" />
      </div>
    </v-form-group>
  </validated-form>

  <validated-form slot="section-properties" @input="save()" v-if="loaded">
  </validated-form>

  <validated-form slot="font-properties" @input="save()" v-if="loaded">
  </validated-form>

  <validated-form slot="border-properties" @input="save()" v-if="loaded">
  </validated-form>

  <validated-form slot="ticker-properties" @input="save()" v-if="loaded">
  </validated-form>

  <validated-form slot="image-properties" @input="save()" v-if="loaded">
  </validated-form>
</widget-editor>
</template>

<script lang="ts" src="./SpinWheel.vue.ts"></script>

<style lang="less" scoped>
</style>
