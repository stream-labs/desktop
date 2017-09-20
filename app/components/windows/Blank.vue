<template>
<modal-layout
  :show-controls="false"
  title="">
    <div slot="content"></div>
</modal-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import ModalLayout from '../ModalLayout.vue';

@Component({ components: { ModalLayout } })
export default class Blank extends Vue {
}
</script>
