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
    <v-form-group v-for="category in wData.settings.categories">
    </v-form-group>
  </validated-form>
</widget-editor>
</template>

<script lang="ts" src="./SpinWheel.vue.ts"></script>

<style lang="less" scoped>
</style>
