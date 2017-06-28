<template>
  <div>
    <a
      class="slide-open__open link"
      @click="slideOpen = !slideOpen">
      <i class="fa fa-arrow-left" aria-hidden="true"></i> Test Widgets
    </a>
    <transition name="slide-fade">
      <div
        v-if="slideOpen"
        class="slide-open__menu">
        <a class="slide-open__close"
          @click="slideOpen = !slideOpen">
          <i class="fa fa-times" aria-hidden="true"></i>
        </a>
        <div class="button-container">
          <button class="button button--trans">Follow</button>
          <button class="button button--trans">Subscription</button>
          <button class="button button--trans">Donation</button>
          <button class="button button--trans">Hosting</button>
          <button class="button button--trans">Bit</button>
          <button class="button button--trans">Redemption</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

@Component({})
export default class TestWidgets extends Vue {
  slideOpen = false;
}
</script>

